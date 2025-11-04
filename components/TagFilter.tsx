import React, { useState, useEffect, useRef } from 'react';

interface TagFilterProps {
  allTags: string[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ allTags, selectedTags, onSelectedTagsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const toggleTag = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onSelectedTagsChange(newSelectedTags);
  };

  const filteredTags = allTags.filter(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

  const getButtonLabel = () => {
    if (selectedTags.length === 0) return "Filter by tags...";
    if (selectedTags.length === 1) return selectedTags[0];
    return `${selectedTags.length} tags selected`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 text-left text-black bg-white/20 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/20 dark:placeholder-gray-400 backdrop-blur-sm transition-all flex justify-between items-center"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getButtonLabel()}</span>
        <svg className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-full mt-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border border-white/20 dark:border-black/20 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tags..."
              className="w-full py-2 px-3 text-black bg-white/50 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white dark:bg-black/50 dark:placeholder-gray-400"
            />
          </div>
          <ul role="listbox">
            {filteredTags.map(tag => (
              <li
                key={tag}
                onClick={() => toggleTag(tag)}
                className="px-4 py-2 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center gap-3"
                role="option"
                aria-selected={selectedTags.includes(tag)}
              >
                <div className={`w-4 h-4 rounded border-2 ${selectedTags.includes(tag) ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}>
                    {selectedTags.includes(tag) && <svg viewBox="0 0 16 16" fill="white"><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>}
                </div>
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};