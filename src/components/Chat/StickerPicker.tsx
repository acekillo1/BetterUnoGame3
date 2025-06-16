import React, { useState } from 'react';
import { STICKERS, STICKER_CATEGORIES } from '../../data/stickers';
import { Sticker } from '../../types/Chat';

interface StickerPickerProps {
  onSelectSticker: (stickerId: string) => void;
  onClose: () => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({
  onSelectSticker,
  onClose
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('emotions');

  const filteredStickers = STICKERS.filter(
    sticker => sticker.category === activeCategory
  );

  return (
    <div className="p-3 max-h-64 overflow-hidden">
      {/* Category Tabs */}
      <div className="flex gap-1 mb-3 bg-gray-50 rounded-lg p-1">
        {STICKER_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              activeCategory === category.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="text-sm mb-1">{category.icon}</div>
            <div>{category.name}</div>
          </button>
        ))}
      </div>

      {/* Stickers Grid */}
      <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
        {filteredStickers.map(sticker => (
          <button
            key={sticker.id}
            onClick={() => onSelectSticker(sticker.id)}
            className="aspect-square flex items-center justify-center text-2xl hover:bg-gray-100 rounded-lg transition-colors"
            title={sticker.name}
          >
            {sticker.emoji}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 mb-2">Nhanh:</div>
        <div className="flex gap-1">
          {['happy', 'thumbs-up', 'uno', 'fire'].map(quickStickerId => {
            const sticker = STICKERS.find(s => s.id === quickStickerId);
            return sticker ? (
              <button
                key={sticker.id}
                onClick={() => onSelectSticker(sticker.id)}
                className="p-2 text-xl hover:bg-gray-100 rounded-lg transition-colors"
                title={sticker.name}
              >
                {sticker.emoji}
              </button>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
};

export default StickerPicker;