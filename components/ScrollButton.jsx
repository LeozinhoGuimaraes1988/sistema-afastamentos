import { useState, useEffect } from 'react';
import styles from '../components/ScrollButton.module.css';

const ScrollToTopButton = () => {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Mostra o botão se o usuário rolar mais de 300px
      setShowButton(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);

    // Remove o listener ao desmontar o componente
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // Adiciona rolagem suave
    });
  };

  return (
    showButton && (
      <button onClick={scrollToTop} className={styles.scrollToTop}>
        ↑ Início
      </button>
    )
  );
};

export default ScrollToTopButton;
