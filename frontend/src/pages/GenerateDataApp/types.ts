export type DataTypeCategory = 
  | 'personal'
  | 'contact'
  | 'location'
  | 'numeric'
  | 'text'
  | 'identifiers'
  | 'datetime'
  | 'custom';

export type DataTypeKey =
  | 'name_full'
  | 'name_first'
  | 'name_last'
  | 'cpf'
  | 'cnpj'
  | 'email'
  | 'phone'
  | 'address_street'
  | 'address_city'
  | 'address_state'
  | 'address_zip'
  | 'country'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'uuid'
  | 'autoincrement'
  | 'date'
  | 'time'
  | 'timestamp'
  | 'company_name'
  | 'word'
  | 'sentence'
  | 'custom_regex'
  | 'custom_list';

export interface DataTypeOption {
  key: DataTypeKey;
  label: string;
  category: DataTypeCategory;
  description: string;
  defaultOptions?: Record<string, any>;
}

export interface ColumnDefinition {
  id: string;
  title: string;
  type: DataTypeKey;
  nullPercentage: number; // 0 to 100
  options?: {
    min?: number;
    max?: number;
    decimals?: number;
    regexFormat?: string;
    customValues?: string[];
    dateFormat?: string;
    prefix?: string;
    suffix?: string;
  };
}

export type ExportFormat = 'sql' | 'json' | 'csv' | 'xml' | 'tsv';

export type SqlDialect = 'mysql' | 'postgres' | 'oracle' | 'sqlite';

export interface ExportConfig {
  format: ExportFormat;
  rowCount: number;
  tableName: string;
  sqlDialect: SqlDialect;
  includeDropTable: boolean;
  locale: 'pt-BR' | 'en-US';
}
