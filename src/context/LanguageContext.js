import { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('telugu'); // 'telugu' or 'english'

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'telugu' ? 'english' : 'telugu');
  };

  const t = (teluguText, englishText) => {
    return language === 'telugu' ? teluguText : englishText;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);