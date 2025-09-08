import type { FunctionalComponent, ComponentChildren } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import './styles.css';

interface Props {
  buttonChildren: ComponentChildren;
  buttonClass?: string;
}

const ButtonWithPopover: FunctionalComponent<Props> = ({
  children,
  buttonChildren,
  buttonClass = '',
}) => {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const onClick = (event: MouseEvent) => {
      if (!dialogRef.current!.contains(event.target as Node)) {
        dialogRef.current!.close();
      }
    };

    dialogRef.current!.addEventListener(
      'beforetoggle',
      (event) => {
        if (event.newState === 'open') {
          addEventListener('click', onClick, {
            signal: controller.signal,
          });
        } else {
          removeEventListener('click', onClick);
        }
      },
      { signal: controller.signal }
    );

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <button
        class={buttonClass}
        commandFor={id}
        command="show-modal"
        style={`anchor-name: --${id}`}
      >
        {buttonChildren}
      </button>
      <dialog
        id={id}
        class="popover-button-popover"
        style={{ '--position-anchor': `--${id}` }}
        ref={dialogRef}
      >
        <div class="popover-button-popover-content">{children}</div>
      </dialog>
    </>
  );
};

export default ButtonWithPopover;
