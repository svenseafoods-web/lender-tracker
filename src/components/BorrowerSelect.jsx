import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, User } from 'lucide-react';

const BorrowerSelect = ({ value, onChange, existingBorrowers }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearch(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredBorrowers = existingBorrowers.filter(name =>
        name.toLowerCase().includes(search.toLowerCase()) && name !== search
    );

    const handleSelect = (name) => {
        onChange(name);
        setSearch(name);
        setIsOpen(false);
    };

    return (
        <div className="input-group" ref={wrapperRef}>
            <label className="input-label">Borrower Name</label>
            <div style={{ position: 'relative' }}>
                <div className="input-field" style={{ display: 'flex', alignItems: 'center', padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        className="input-field"
                        style={{ border: 'none', flex: 1, paddingLeft: 0 }}
                        placeholder="Enter or select borrower"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            onChange(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                    />
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.75rem' }}
                    >
                        <ChevronDown size={18} />
                    </button>
                </div>

                {isOpen && (search || filteredBorrowers.length > 0) && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '0.25rem',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        {filteredBorrowers.length > 0 ? (
                            filteredBorrowers.map((name, index) => (
                                <div
                                    key={index}
                                    onClick={() => handleSelect(name)}
                                    style={{
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--border-color)',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                    {name}
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                {search ? 'Press enter to add new' : 'Type to search...'}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BorrowerSelect;
