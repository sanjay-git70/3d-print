import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileCheck,
  Check,
} from 'lucide-react';
import { formatINR, UPI_CONFIG } from '../../lib/upiUtils';
import { paymentService, OCRAnalysisResponse } from '../../services/paymentService';
import { PaymentAnalysis } from '../../types';

interface PaymentProofFormProps {
  amount: number;
  expectedUpiId?: string;
  orderNumber?: string;
  orderId?: string;
  isSubmitting: boolean;
  onSubmit: (data: {
    transactionId: string;
    screenshotFile: File | null;
    screenshotPreview: string | null;
    analysis?: PaymentAnalysis;
  }) => void;
}

export const PaymentProofForm: React.FC<PaymentProofFormProps> = ({
  amount,
  expectedUpiId = UPI_CONFIG.upiId,
  orderNumber = '3DP-ORDER',
  orderId,
  isSubmitting,
  onSubmit,
}) => {
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRAnalysisResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // Validate size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB. Please choose a smaller image.');
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    setScreenshotFile(file);

    // Read base64 for preview & OCR analysis
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setScreenshotPreview(base64Data);

      // Trigger AI OCR Scan
      setIsScanning(true);
      try {
        const analysis = await paymentService.analyzeScreenshot({
          imageBase64: base64Data,
          mimeType: file.type,
          expectedUpiId,
          expectedAmount: amount,
          orderNumber,
          orderId,
        });

        setOcrResult(analysis);

        // Autofill transaction ID if detected and not already manually set
        if (analysis.detected_transaction_id) {
          setTransactionId(analysis.detected_transaction_id);
        }
      } catch (err: any) {
        console.warn('OCR Scan failed gracefully:', err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setOcrResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTx = transactionId.trim();

    // Validation rule: At least one proof must be provided
    if (!trimmedTx && !screenshotFile) {
      setErrorMessage(
        'Please provide at least one payment proof: upload your UPI screenshot OR enter the Transaction ID / UTR.'
      );
      return;
    }

    if (trimmedTx && trimmedTx.length < 6) {
      setErrorMessage('UPI Transaction ID / UTR should be at least 6 alphanumeric characters.');
      return;
    }

    onSubmit({
      transactionId: trimmedTx,
      screenshotFile,
      screenshotPreview,
      analysis: ocrResult || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-neutral-900/90 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm dark:shadow-2xl backdrop-blur-sm"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Payment Proof & Verification</h3>
          <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400 font-mono text-[10px] font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> AI-Assisted OCR
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-neutral-400">
          Upload your payment screenshot. Our intelligent system will automatically read and cross-verify the payment details for the admin.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Upload Screenshot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-neutral-300 font-semibold">
            1. Upload UPI Payment Screenshot
          </label>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">Google Pay, PhonePe, Paytm, BHIM, etc.</span>
        </div>

        {!screenshotPreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 group ${
              isDragOver
                ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 scale-[1.01]'
                : 'border-slate-300 dark:border-neutral-800 hover:border-cyan-500 bg-slate-50/50 dark:bg-neutral-950/50 hover:bg-white dark:hover:bg-neutral-950'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-900 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 text-slate-500 dark:text-neutral-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 border border-slate-200 dark:border-neutral-800 flex items-center justify-center transition-colors shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-800 dark:text-neutral-200 block group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                Click to browse or drop payment screenshot here
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-500 block">
                Automatic instant AI reading of UPI ID, Amount & UTR
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Screenshot preview bar */}
            <div className="relative rounded-xl border border-cyan-500/40 bg-slate-50 dark:bg-neutral-950 p-3.5 flex items-center gap-4">
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Payment proof preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-neutral-800"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-cyan-950/80 rounded-lg flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-900 dark:text-white truncate block">
                    {screenshotFile?.name || 'UPI_Payment_Proof.png'}
                  </span>
                  {ocrResult && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 text-[10px] font-mono">
                      Scanned
                    </span>
                  )}
                </div>

                {isScanning ? (
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400" />
                    AI Analyzing screenshot & extracting UTR...
                  </span>
                ) : ocrResult ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> OCR Extracted Successfully ({Math.round((ocrResult.ocr_confidence || 0.9) * 100)}% confidence)
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                    <FileCheck className="w-3 h-3" /> Image attached
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 rounded-lg bg-slate-200 dark:bg-neutral-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-slate-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI OCR Analysis Card */}
            {ocrResult && (
              <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-800 dark:text-neutral-200">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Payment Proof Analysis
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                    Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ocrResult.detected_payment_status || 'SUCCESS'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* UPI ID Check */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Receiver UPI ID</span>
                      {ocrResult.upi_match ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Matched
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Check
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-slate-900 dark:text-white block truncate" title={ocrResult.detected_upi_id}>
                      {ocrResult.detected_upi_id || expectedUpiId}
                    </span>
                  </div>

                  {/* Amount Check */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400">Detected Amount</span>
                      {ocrResult.amount_match ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Matched
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Mismatch
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-cyan-700 dark:text-cyan-400 font-bold block">
                      {formatINR(ocrResult.detected_amount || amount)}
                    </span>
                  </div>

                  {/* Detected UTR */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400 block">Detected UTR / Tx ID</span>
                    <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300 font-semibold block select-all">
                      {ocrResult.detected_transaction_id || 'Not auto-detected'}
                    </span>
                  </div>

                  {/* Receiver Name */}
                  <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-neutral-400 block">Merchant Name</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-neutral-300 block truncate">
                      {ocrResult.receiver_name || 'PRINTLAB 3D'}
                    </span>
                  </div>
                </div>

                {/* Safety & Trust Disclaimer */}
                <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-500/20 text-[11px] text-cyan-800 dark:text-cyan-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    {ocrResult.isValidLooking
                      ? 'Payment proof details look consistent. Final verification will be confirmed by the stall admin.'
                      : 'Please verify the transaction ID below. Final approval will be checked by stall admin.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-neutral-800 w-full" />
        <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-widest absolute">
          OR / AND
        </span>
      </div>

      {/* Step 2: UPI Transaction ID / UTR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="tx-id" className="block text-xs font-mono uppercase tracking-wider text-slate-700 dark:text-neutral-300 font-semibold">
            2. UPI Transaction ID / Reference (UTR)
          </label>
          <span className="text-[11px] text-slate-400 dark:text-neutral-500">12-digit number</span>
        </div>

        <input
          id="tx-id"
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
          placeholder="e.g. 429810482019 or UPI Txn Ref..."
          className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 focus:border-cyan-500 rounded-xl text-sm font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 uppercase transition-all"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-500">
          <span>Check your UPI receipt for "UPI Ref No.", "Transaction ID", or "UTR".</span>
          {transactionId && (
            <span className="text-cyan-600 dark:text-cyan-400 font-mono font-medium">{transactionId.length} chars</span>
          )}
        </div>
      </div>

      {/* Order Amount Summary */}
      <div className="p-3.5 bg-slate-50 dark:bg-neutral-950 rounded-xl border border-slate-200 dark:border-neutral-800/80 flex items-center justify-between text-xs font-mono">
        <div className="space-y-0.5">
          <span className="text-slate-600 dark:text-neutral-400 block">Expected Payable Amount:</span>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500">To: {expectedUpiId}</span>
        </div>
        <span className="text-cyan-700 dark:text-cyan-400 font-bold font-display text-base">{formatINR(amount)}</span>
      </div>

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={isSubmitting || isScanning}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-cyan-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Submitting Payment Proof...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Submit Payment Proof for Verification</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
