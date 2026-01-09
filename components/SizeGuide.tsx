'use client';

import React from 'react';
import { Ruler } from 'lucide-react';

const SizeGuide: React.FC = () => {
  return (
    <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 animate-in fade-in slide-in-from-top duration-500">
      <div className="flex items-center space-x-2 mb-4 text-neutral-900">
        <Ruler size={18} />
        <h3 className="text-sm font-bold uppercase tracking-widest">Size Guide</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="py-2 pr-4 font-bold uppercase text-neutral-400">Size</th>
              <th className="py-2 pr-4 font-bold uppercase text-neutral-400">Chest (in)</th>
              <th className="py-2 pr-4 font-bold uppercase text-neutral-400">Waist (in)</th>
              <th className="py-2 pr-4 font-bold uppercase text-neutral-400">Hip (in)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            <tr>
              <td className="py-3 pr-4 font-medium">XS</td>
              <td className="py-3 pr-4">32 - 34</td>
              <td className="py-3 pr-4">26 - 28</td>
              <td className="py-3 pr-4">34 - 36</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">S</td>
              <td className="py-3 pr-4">35 - 37</td>
              <td className="py-3 pr-4">29 - 31</td>
              <td className="py-3 pr-4">37 - 39</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">M</td>
              <td className="py-3 pr-4">38 - 40</td>
              <td className="py-3 pr-4">32 - 34</td>
              <td className="py-3 pr-4">40 - 42</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">L</td>
              <td className="py-3 pr-4">41 - 43</td>
              <td className="py-3 pr-4">35 - 37</td>
              <td className="py-3 pr-4">43 - 45</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-medium">XL</td>
              <td className="py-3 pr-4">44 - 46</td>
              <td className="py-3 pr-4">38 - 40</td>
              <td className="py-3 pr-4">46 - 48</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-white border border-neutral-200 rounded text-[10px] text-neutral-500 italic">
        *Measurements refer to body size, not garment dimensions. If you're between sizes, we recommend sizing up for a relaxed fit.
      </div>
    </div>
  );
};

export default SizeGuide;

