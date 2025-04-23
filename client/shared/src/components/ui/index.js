/**
 * Index de componentes UI compartidos
 * 
 * Este archivo exporta todos los componentes UI comunes
 * para facilitar su importación en los módulos.
 */

// Exportar componentes
export { default as Button } from './Button';
export { default as Card } from './Card';
export { default as Input } from './Input';
export { default as Modal } from './Modal';
export { default as Alert } from './Alert';
export { default as Spinner } from './Spinner';
export { default as Badge } from './Badge';
export { default as Dropdown } from './Dropdown';
export { default as Tabs } from './Tabs';
export { default as Table } from './Table';
export { default as Pagination } from './Pagination';
export { default as DatePicker } from './DatePicker';
export { default as FileUpload } from './FileUpload';
export { default as Toast } from './Toast';
export { default as Avatar } from './Avatar';
export { default as Select } from './Select';
export { default as Tooltip } from './Tooltip';
export { default as ProgressBar } from './ProgressBar';
export { default as SearchInput } from './SearchInput';
export { default as SidePanel } from './SidePanel';

// Exportar utilidades UI
export { default as useUITheme } from './hooks/useUITheme';
export { default as useToast } from './hooks/useToast';
export { default as useModal } from './hooks/useModal';
export { default as useForm } from './hooks/useForm';
export { default as useMediaQuery } from './hooks/useMediaQuery';
export { default as useClickOutside } from './hooks/useClickOutside';

// Exportar constantes
export { THEME_MODES, BUTTON_VARIANTS, ALERT_TYPES } from './constants';

// Exportar contextos
export { UIProvider, useUIContext } from './context/UIContext';
export { ToastProvider } from './context/ToastContext';
export { ModalProvider } from './context/ModalContext'; 