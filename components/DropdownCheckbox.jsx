import React, { useState } from 'react';
import styles from '../components/DropdownCheckbox.module.css';

const DropdownCheckbox = ({ options, selectedOptions, toggleOption }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest(`.${styles.dropdown}`)) {
      setIsOpen(false);
    }
  };

  // Fecha o dropdown ao clicar fora dele
  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={styles.dropdown}>
      <button onClick={handleToggleDropdown} className={styles.dropdownButton}>
        Selecionar Cargos
      </button>
      {isOpen && (
        <div className={styles.dropdownContent}>
          {options.map((option, index) => (
            <label key={index} className={styles.optionContent}>
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                onChange={() => toggleOption(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownCheckbox;
