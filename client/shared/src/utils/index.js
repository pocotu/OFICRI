/**
 * Índice de utilidades compartidas
 * 
 * Este archivo exporta todas las utilidades comunes para
 * facilitar su importación en los módulos.
 */

// Exportar utilidades básicas
export { default as dateUtils } from './date';
export { default as stringUtils } from './string';
export { default as numberUtils } from './number';
export { default as arrayUtils } from './array';
export { default as objectUtils } from './object';
export { default as fileUtils } from './file';
export { default as storageUtils } from './storage';
export { default as urlUtils } from './url';
export { default as validationUtils } from './validation';
export { default as formatUtils } from './format';
export { default as printUtils } from './print';
export { default as domUtils } from './dom';

// Exportar utilidades específicas
export { default as eventBus } from './eventBus';
export { default as permissionUtils } from './permission';
export { default as documentUtils } from './document';
export { default as areaUtils } from './area';
export { default as userUtils } from './user';
export { default as reportUtils } from './report';
export { default as exportUtils } from './export';
export { default as searchUtils } from './search';
export { default as notificationUtils } from './notification';
export { default as resolutionUtils } from './resolution';

// Exportar funciones de ayuda específicas
export { 
  formatDate, 
  parseDate, 
  getDateDifference, 
  isDateBefore, 
  isDateAfter 
} from './date';

export { 
  formatCurrency, 
  formatNumber, 
  formatPercentage, 
  parseNumber 
} from './number';

export { 
  truncateText, 
  slugify, 
  capitalize, 
  camelToSnake, 
  snakeToCamel 
} from './string';

export { 
  deepMerge, 
  deepClone, 
  pick, 
  omit, 
  hasChanged 
} from './object';

export { 
  groupBy, 
  sortBy, 
  filterBy, 
  unique, 
  paginate 
} from './array';

export { 
  downloadFile, 
  getFileSize, 
  getFileExtension, 
  isValidFileType, 
  getFileTypeIcon 
} from './file';

export { 
  setLocalStorage, 
  getLocalStorage, 
  removeLocalStorage, 
  clearLocalStorage 
} from './storage';

export { 
  buildUrl, 
  getQueryParams, 
  addQueryParams, 
  removeQueryParams 
} from './url';

export { 
  validateEmail, 
  validatePassword, 
  validateRequired, 
  validateCIP 
} from './validation';

export { 
  formatAddress, 
  formatName, 
  formatDocumentNumber, 
  formatPhone 
} from './format';

export { 
  printDocument, 
  printElement, 
  getPrintStyle, 
  preparePrint 
} from './print';

export { 
  scrollTo, 
  getViewportSize, 
  isElementInViewport, 
  getScrollPosition 
} from './dom'; 