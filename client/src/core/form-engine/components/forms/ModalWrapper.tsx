import { cloneElement, type ReactElement, useState, type HTMLAttributes } from 'react';

interface ModalWrapperProps {
    children: ReactElement<HTMLAttributes<HTMLElement>>;
    content: React.ReactNode;
}

interface ModalContentProps {
    closeModal?: () => void;
    isOpen?: boolean;
}

/**
 * @title Compound Component Wrapper
 * @description Gestiona el estado de apertura y la inyección de props 
 * mediante clonación (Prop Injection) para sincronizar el disparador y el contenido.
 */

export const ModalWrapper = ({ children, content }: ModalWrapperProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);


    const contentWithProps = cloneElement(content as ReactElement<ModalContentProps>, {
        closeModal: close,
        isOpen: isOpen
    } as ModalContentProps);

    const trigger = cloneElement(children, {
        onClick: (e: React.MouseEvent<HTMLElement>) => {
            children.props.onClick?.(e);
            open();
        }
    });

    return (
        <>
            {trigger}
            {isOpen && contentWithProps}
        </>
    );
};