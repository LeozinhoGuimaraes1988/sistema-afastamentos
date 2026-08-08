import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './CustomSelect.module.css';

// interface Option {
//   value: string;
//   label: string;
// }

// interface CustomSelectProps {
//   value: string;
//   onChange: (value: string) => void;
//   options: Option[];
//   placeholder: string;
//   label: string;
//   required?: boolean;
//   disabled?: boolean;
// }

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  label,
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={styles.selectContainer}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <div
        className={`${styles.select} ${isOpen ? styles.open : ''} ${
          disabled ? styles.disabled : ''
        }`}
      >
        <div
          className={styles.selectTrigger}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span
            className={`${styles.selectValue} ${
              !value ? styles.placeholder : ''
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={`${styles.selectIcon} ${isOpen ? styles.rotated : ''}`}
            size={20}
          />
        </div>

        {isOpen && (
          <div className={styles.selectDropdown}>
            <div className={styles.selectOptions}>
              {options.map((option) => (
                <div
                  key={option.value}
                  className={`${styles.selectOption} ${
                    value === option.value ? styles.selected : ''
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default CustomSelect;
