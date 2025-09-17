import type { FunctionalComponent } from 'preact';
import { useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';

import './styles.css';
import { useChangeEffect } from '../../utils/useChangeEffect';

interface Props {
  value: string;
  onChange: (newValue: string) => void;
}

const TitleFilter: FunctionalComponent<Props> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const innerValue = useSignal(value);
  const dispatchedValue = useRef(value);
  const timeoutRef = useRef<number | null>(null);

  useChangeEffect(() => {
    if (dispatchedValue.current === value) return;
    innerValue.value = value;
  }, [value]);

  const onInput = () => {
    if (!inputRef.current) return;
    innerValue.value = inputRef.current.value;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      dispatchedValue.current = innerValue.value;
      onChange(innerValue.value);
    }, 100);
  };

  return (
    <p>
      <label>
        Title filter:{' '}
        <input
          ref={inputRef}
          type="text"
          value={innerValue}
          onInput={onInput}
        />
      </label>
    </p>
  );
};

export default TitleFilter;
