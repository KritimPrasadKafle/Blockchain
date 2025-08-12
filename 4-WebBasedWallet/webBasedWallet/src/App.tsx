import React, { useState, useCallback, useMemo } from 'react';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';
import { HDNode } from '@ethersproject/hdnode';
import { Wallet } from '@ethersproject/wallet';
import nacl from 'tweetnacl';
import { Copy, Eye, EyeOff, Wallet2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

// Types
interface WalletData {
  address: string;
  privateKey: string;
  derivationPath: string;
  index: number;
}

interface WalletState {
  solana: WalletData[];
  ethereum: WalletData[];
}

// Constants
const DERIVATION_PATHS = {
  SOLANA: "m/44'/501'",
  ETHEREUM: "m/44'/60'"
} as const;

// Utility functions
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const truncateAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Components
const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
      title={label || "Copy to clipboard"}
    >
      {copied ? (
        <>
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </button>
  );
};

const WalletCard: React.FC<{
  wallet: WalletData;
  chainType: 'solana' | 'ethereum';
  onRemove: () => void;
}> = ({ wallet, chainType, onRemove }) => {
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Wallet2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            {chainType === 'solana' ? 'Solana' : 'Ethereum'} Wallet #{wallet.index + 1}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Remove
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Address</label>
          <div className="flex items-center gap-2">
            <code className="text-sm text-green-400 font-mono break-all">
              {wallet.address}
            </code>
            <CopyButton text={wallet.address} />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Private Key</label>
          <div className="flex items-center gap-2">
            {showPrivateKey ? (
              <code className="text-xs text-red-400 font-mono break-all flex-1">
                {wallet.privateKey}
              </code>
            ) : (
              <code className="text-xs text-gray-500 font-mono flex-1">
                ••••••••••••••••••••••••••••••••
              </code>
            )}
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={showPrivateKey ? "Hide private key" : "Show private key"}
            >
              {showPrivateKey ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4 text-gray-400" />
              )}
            </button>
            {showPrivateKey && <CopyButton text={wallet.privateKey} />}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Derivation Path</label>
          <code className="text-xs text-gray-500 font-mono">{wallet.derivationPath}</code>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function HDWalletManager() {
  const [mnemonic, setMnemonic] = useState<string>('');
  const [customMnemonic, setCustomMnemonic] = useState<string>('');
  const [wallets, setWallets] = useState<WalletState>({ solana: [], ethereum: [] });
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const isValidMnemonic = useMemo(() => {
    return mnemonic ? bip39.validateMnemonic(mnemonic) : false;
  }, [mnemonic]);

  const generateNewMnemonic = useCallback(() => {
    setIsGenerating(true);
    setError('');
    
    setTimeout(() => {
      try {
        // Debug logging
        console.log('Attempting to generate mnemonic...');
        console.log('bip39 object:', bip39);
        
        const newMnemonic = bip39.generateMnemonic();
        console.log('Generated mnemonic:', newMnemonic);
        
        setMnemonic(newMnemonic);
        setCustomMnemonic(newMnemonic);
        setWallets({ solana: [], ethereum: [] });
      } catch (err) {
        console.error('Error generating mnemonic:', err);
        setError(`Failed to generate mnemonic: ${err.message || 'Unknown error'}`);
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  }, []);

  const importMnemonic = useCallback(() => {
    const trimmedMnemonic = customMnemonic.trim();
    
    if (!trimmedMnemonic) {
      setError('Please enter a mnemonic phrase');
      return;
    }

    if (!bip39.validateMnemonic(trimmedMnemonic)) {
      setError('Invalid mnemonic phrase. Please check and try again.');
      return;
    }

    setError('');
    setMnemonic(trimmedMnemonic);
    setWallets({ solana: [], ethereum: [] });
  }, [customMnemonic]);

  const generateSolanaWallet = useCallback(() => {
    if (!mnemonic) return;

    try {
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const currentIndex = wallets.solana.length;
      const derivationPath = `${DERIVATION_PATHS.SOLANA}/${currentIndex}'/0'`;
      
      const derivedSeed = derivePath(derivationPath, seed.toString("hex")).key;
      const keypair = nacl.sign.keyPair.fromSeed(derivedSeed);
      const solanaKeypair = Keypair.fromSecretKey(keypair.secretKey);
      
      const newWallet: WalletData = {
        address: solanaKeypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex'),
        derivationPath,
        index: currentIndex
      };

      setWallets(prev => ({
        ...prev,
        solana: [...prev.solana, newWallet]
      }));
      setError('');
    } catch (err) {
      console.error('Error generating Solana wallet:', err);
      setError(`Failed to generate Solana wallet: ${err.message || 'Unknown error'}`);
    }
  }, [mnemonic, wallets.solana.length]);

  const generateEthereumWallet = useCallback(() => {
    if (!mnemonic) return;

    try {
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const hdNode = HDNode.fromSeed(seed);
      const currentIndex = wallets.ethereum.length;
      const derivationPath = `${DERIVATION_PATHS.ETHEREUM}/${currentIndex}`;
      
      const child = hdNode.derivePath(derivationPath);
      const wallet = new Wallet(child.privateKey);
      
      const newWallet: WalletData = {
        address: wallet.address,
        privateKey: child.privateKey,
        derivationPath,
        index: currentIndex
      };

      setWallets(prev => ({
        ...prev,
        ethereum: [...prev.ethereum, newWallet]
      }));
      setError('');
    } catch (err) {
      console.error('Error generating Ethereum wallet:', err);
      setError(`Failed to generate Ethereum wallet: ${err.message || 'Unknown error'}`);
    }
  }, [mnemonic, wallets.ethereum.length]);

  const removeWallet = useCallback((chain: 'solana' | 'ethereum', index: number) => {
    setWallets(prev => ({
      ...prev,
      [chain]: prev[chain].filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Multi-Chain HD Wallet Manager
          </h1>
          <p className="text-gray-400">Generate and manage HD wallets for Solana and Ethereum</p>
        </div>

        {/* Mnemonic Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Seed Phrase
          </h2>

          {!mnemonic ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Generate new or import existing seed phrase
                </label>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={generateNewMnemonic}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Generate New
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Or import existing seed phrase
                </label>
                <textarea
                  value={customMnemonic}
                  onChange={(e) => setCustomMnemonic(e.target.value)}
                  placeholder="Enter your 12 or 24 word seed phrase..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  rows={3}
                />
                <button
                  onClick={importMnemonic}
                  className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Import Seed Phrase
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">Your seed phrase (keep this safe!)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMnemonic(!showMnemonic)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    {showMnemonic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showMnemonic ? 'Hide' : 'Show'}
                  </button>
                  {showMnemonic && <CopyButton text={mnemonic} />}
                </div>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg mb-4">
                {showMnemonic ? (
                  <p className="font-mono text-sm leading-relaxed">{mnemonic}</p>
                ) : (
                  <p className="font-mono text-sm text-gray-500">
                    •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Never share your seed phrase. Anyone with access to it can steal your funds.
                </p>
              </div>

              <button
                onClick={() => {
                  setMnemonic('');
                  setCustomMnemonic('');
                  setWallets({ solana: [], ethereum: [] });
                }}
                className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear seed phrase and wallets
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Wallets Section */}
        {mnemonic && isValidMnemonic && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Solana Wallets */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Solana Wallets</h3>
                <button
                  onClick={generateSolanaWallet}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Wallet2 className="w-4 h-4" />
                  Add Wallet
                </button>
              </div>

              <div className="space-y-3">
                {wallets.solana.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No Solana wallets yet. Click "Add Wallet" to create one.
                  </p>
                ) : (
                  wallets.solana.map((wallet, index) => (
                    <WalletCard
                      key={wallet.address}
                      wallet={wallet}
                      chainType="solana"
                      onRemove={() => removeWallet('solana', index)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Ethereum Wallets */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Ethereum Wallets</h3>
                <button
                  onClick={generateEthereumWallet}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Wallet2 className="w-4 h-4" />
                  Add Wallet
                </button>
              </div>

              <div className="space-y-3">
                {wallets.ethereum.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No Ethereum wallets yet. Click "Add Wallet" to create one.
                  </p>
                ) : (
                  wallets.ethereum.map((wallet, index) => (
                    <WalletCard
                      key={wallet.address}
                      wallet={wallet}
                      chainType="ethereum"
                      onRemove={() => removeWallet('ethereum', index)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}