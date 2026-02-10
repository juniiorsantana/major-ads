import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
    id: string;
    name: string;
    subtitle?: string;
    meta?: string;
}

interface MultiSelectDropdownProps {
    options: MultiSelectOption[];
    selectedIds: string[];
    onChange: (selectedIds: string[]) => void;
    placeholder?: string;
    label?: string;
    description?: string;
    loading?: boolean;
    error?: string | null;
    emptyMessage?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
    options,
    selectedIds,
    onChange,
    placeholder = 'Selecione...',
    label,
    description,
    loading = false,
    error = null,
    emptyMessage = 'Nenhum item encontrado'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.id.includes(searchQuery)
    );

    const toggleOption = (id: string) => {
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(selectedId => selectedId !== id)
            : [...selectedIds, id];
        onChange(newSelection);
    };

    const removeChip = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(selectedId => selectedId !== id));
    };

    const handleSelectAll = () => {
        if (selectedIds.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.id));
        }
    };

    const selectedOptions = options.filter(o => selectedIds.includes(o.id));

    return (
        <div className="space-y-2" ref={containerRef}>
            {/* Label and Description */}
            {label && (
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-slate-700">{label}</label>
                    {options.length > 0 && (
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                            {selectedIds.length === options.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </button>
                    )}
                </div>
            )}
            {description && (
                <p className="text-sm text-slate-500">{description}</p>
            )}

            {/* Main Container */}
            <div className="relative">
                {/* Trigger Button / Chips Display */}
                <div
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if (!isOpen) {
                            setTimeout(() => inputRef.current?.focus(), 0);
                        }
                    }}
                    className={`
                        min-h-[48px] px-3 py-2 
                        bg-white rounded-xl border-2 
                        cursor-pointer transition-all duration-200
                        ${isOpen
                            ? 'border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5'
                            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                        }
                        ${error ? 'border-red-300 bg-red-50/50' : ''}
                    `}
                >
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Selected Chips */}
                        {selectedOptions.length > 0 ? (
                            <>
                                {selectedOptions.slice(0, 3).map(option => (
                                    <span
                                        key={option.id}
                                        className="
                                            inline-flex items-center gap-1.5 
                                            px-3 py-1.5 
                                            bg-gradient-to-r from-blue-50 to-indigo-50
                                            text-blue-700 text-sm font-medium 
                                            rounded-lg border border-blue-200/50
                                            shadow-sm
                                            animate-in fade-in zoom-in-95 duration-200
                                        "
                                    >
                                        <span className="max-w-[120px] truncate">{option.name}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeChip(option.id, e)}
                                            className="
                                                p-0.5 rounded-full 
                                                hover:bg-blue-200 
                                                transition-colors
                                                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                                            "
                                            aria-label={`Remover ${option.name}`}
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </span>
                                ))}
                                {selectedOptions.length > 3 && (
                                    <span className="
                                        px-2.5 py-1 
                                        bg-slate-100 text-slate-600 
                                        text-sm font-medium rounded-lg
                                    ">
                                        +{selectedOptions.length - 3} mais
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-slate-400 py-1">{placeholder}</span>
                        )}

                        {/* Dropdown Arrow */}
                        <div className="ml-auto flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {selectedIds.length}
                                </span>
                            )}
                            <svg
                                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Dropdown Panel */}
                {isOpen && (
                    <div className="
                        absolute z-50 w-full mt-2 
                        bg-white rounded-xl border border-slate-200 
                        shadow-xl shadow-slate-200/50
                        overflow-hidden
                        animate-in fade-in slide-in-from-top-2 duration-200
                    ">
                        {/* Search Input */}
                        <div className="p-3 border-b border-slate-100">
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por nome ou ID..."
                                    className="
                                        w-full pl-10 pr-4 py-2.5 
                                        text-sm rounded-lg 
                                        border border-slate-200 
                                        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                                        transition-all duration-200
                                        outline-none
                                    "
                                />
                            </div>
                        </div>

                        {/* Options List */}
                        <div className="max-h-[280px] overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-8 gap-3">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm text-slate-500">Carregando...</span>
                                </div>
                            ) : filteredOptions.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">{searchQuery ? 'Nenhum resultado encontrado' : emptyMessage}</p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {filteredOptions.map((option, index) => {
                                        const isSelected = selectedIds.includes(option.id);
                                        return (
                                            <div
                                                key={option.id}
                                                onClick={() => toggleOption(option.id)}
                                                className={`
                                                    flex items-center gap-3 
                                                    p-3 rounded-lg 
                                                    cursor-pointer 
                                                    transition-all duration-150
                                                    ${isSelected
                                                        ? 'bg-blue-50 border border-blue-200'
                                                        : 'hover:bg-slate-50 border border-transparent'
                                                    }
                                                `}
                                                style={{ animationDelay: `${index * 30}ms` }}
                                            >
                                                {/* Checkbox */}
                                                <div className={`
                                                    w-5 h-5 rounded-md border-2 
                                                    flex items-center justify-center
                                                    transition-all duration-200
                                                    ${isSelected
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'border-slate-300 bg-white'
                                                    }
                                                `}>
                                                    {isSelected && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>

                                                {/* Option Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                                                        {option.name}
                                                    </p>
                                                    {option.subtitle && (
                                                        <p className="text-xs text-slate-500 truncate">ID: {option.subtitle}</p>
                                                    )}
                                                </div>

                                                {/* Meta Badge */}
                                                {option.meta && (
                                                    <span className={`
                                                        text-xs px-2 py-0.5 rounded-full
                                                        ${option.meta === 'NOT_SET'
                                                            ? 'bg-slate-100 text-slate-500'
                                                            : 'bg-emerald-50 text-emerald-600'
                                                        }
                                                    `}>
                                                        {option.meta === 'NOT_SET' ? 'Não definido' : option.meta}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {filteredOptions.length > 0 && !loading && (
                            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="text-xs text-slate-500">
                                    {selectedIds.length} de {options.length} selecionado(s)
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="
                                        px-4 py-1.5 
                                        text-sm font-medium text-blue-600 
                                        hover:bg-blue-50 rounded-lg
                                        transition-colors
                                    "
                                >
                                    Concluído
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};
