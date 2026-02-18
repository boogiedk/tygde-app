import React, { useState, useRef, useEffect } from 'react';
import './PinModal.css';

interface PinModalProps {
  meetingTitle: string;
  onSubmit: (pin: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const PinModal: React.FC<PinModalProps> = ({ meetingTitle, onSubmit, isLoading, error }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Фокус на первый инпут при открытии
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Разрешаем только цифры
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Автопереход к следующему инпуту
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Переход к предыдущему инпуту при удалении
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      // Фокус на следующий пустой или последний
      const focusIndex = Math.min(pasted.length, 3);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleSubmit = () => {
    const pin = digits.join('');
    if (pin.length === 4 && !isLoading) {
      onSubmit(pin);
    }
  };

  const isComplete = digits.every(d => d !== '');

  return (
    <div className="pin-modal-overlay">
      <div className="pin-modal">
        <h1 className="pin-modal-title">Введите PIN-код</h1>
        <p className="pin-modal-meeting-title">{meetingTitle}</p>

        <div className="pin-input-group" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              className="pin-digit"
              value={digit}
              onChange={e => handleChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              placeholder="•"
              disabled={isLoading}
            />
          ))}
        </div>

        <div className="pin-error">{error || ''}</div>

        <button
          className="pin-submit-button"
          onClick={handleSubmit}
          disabled={!isComplete || isLoading}
        >
          {isLoading ? (
            <span className="pin-loading">Подключение...</span>
          ) : (
            'Войти'
          )}
        </button>
      </div>
    </div>
  );
};

export default PinModal;
