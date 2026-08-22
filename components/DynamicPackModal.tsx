'use client';

import React, { useState } from 'react';
import { SurgicalItem } from '@/lib/types';
import { PlusCircle, X, ShieldAlert, Check } from 'lucide-react';

interface DynamicPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: SurgicalItem[];
  onAddPack: (itemId: string, quantity: number, nurseSignature: string) => void;
}

export const DynamicPackModal: React.FC<DynamicPackModalProps> = ({
  isOpen,
  onClose,
  items,
  onAddPack,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(5);
  const [nurseSignature, setNurseSignature] = useState<string>('SN-772-ROBERTS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;
    onAddPack(selectedItemId, quantity, nurseSignature);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-obsidian-900 border border-cyan-800/80 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-obsidian-800">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-700 text-cyan-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Dynamic Sterile Pack Addition</h3>
            <p className="text-xs text-slate-400">Mid-procedure baseline adjustment with cryptographic audit</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-slate-300 font-semibold mb-1">
              SELECT STERILE PACK ITEM
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Current Baseline: {item.baseline})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-slate-300 font-semibold mb-1">
              QUANTITY TO REGISTER (PACK COUNT)
            </label>
            <div className="flex items-center gap-2">
              {[5, 10, 15].map((qty) => (
                <button
                  type="button"
                  key={qty}
                  onClick={() => setQuantity(qty)}
                  className={`flex-1 py-2 rounded-lg font-bold border transition ${
                    quantity === qty
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-obsidian-950 text-slate-400 border-obsidian-700 hover:border-slate-600'
                  }`}
                >
                  +{qty}
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-20 bg-obsidian-950 border border-obsidian-700 rounded-lg p-2 text-center text-slate-200 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-300 font-semibold mb-1">
              SCRUB NURSE / CIRCULATOR BADGE ID (FDA 21 CFR §11.50)
            </label>
            <input
              type="text"
              required
              value={nurseSignature}
              onChange={(e) => setNurseSignature(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-700 rounded-lg p-2.5 text-cyan-400 font-mono font-bold tracking-wider"
              placeholder="e.g. SN-772-ROBERTS"
            />
          </div>

          <div className="bg-obsidian-950 p-3 rounded-lg border border-obsidian-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Immutable Cryptographic Commit</span>
            </div>
            <p>
              Submitting will increment the baseline total and append a new SHA-256 block into the surgical blackbox ledger.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-obsidian-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-900/50"
            >
              <Check className="w-4 h-4" />
              <span>Commit Sterile Pack</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
