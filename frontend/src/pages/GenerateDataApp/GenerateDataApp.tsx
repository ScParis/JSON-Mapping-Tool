import React, { useState, useMemo } from 'react';
import {
  Database, Plus, Trash2, Download, Copy, Check, Upload, RefreshCw, Eye, Code,
  FileSpreadsheet, Sparkles, Layers, Sliders, Table, FileCode, CheckCircle2
} from 'lucide-react';
import { PageHeader, Card, Button, Select, Badge } from '../../components/ui';
import { ColumnDefinition, ExportConfig, ExportFormat, SqlDialect, DataTypeKey } from './types';
import { DATA_TYPES, generateDataSet, exportFormattedData } from './services/dataGeneratorEngine';
import { SchemaImporterModal } from './components/SchemaImporterModal';

const DEFAULT_COLUMNS: ColumnDefinition[] = [
  { id: '1', title: 'id', type: 'autoincrement', nullPercentage: 0 },
  { id: '2', title: 'nome_completo', type: 'name_full', nullPercentage: 0 },
  { id: '3', title: 'email', type: 'email', nullPercentage: 0 },
  { id: '4', title: 'cpf', type: 'cpf', nullPercentage: 0 },
  { id: '5', title: 'telefone', type: 'phone', nullPercentage: 10 },
  { id: '6', title: 'cidade', type: 'address_city', nullPercentage: 0 },
  { id: '7', title: 'status', type: 'custom_list', nullPercentage: 0, options: { customValues: ['Ativo', 'Inativo', 'Pendente'] } },
  { id: '8', title: 'criado_em', type: 'timestamp', nullPercentage: 0 },
];

export default function GenerateDataApp() {
  const [columns, setColumns] = useState<ColumnDefinition[]>(DEFAULT_COLUMNS);
  const [rowCount, setRowCount] = useState<number>(100);
  const [format, setFormat] = useState<ExportFormat>('sql');
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgres');
  const [tableName, setTableName] = useState<string>('usuarios');
  const [includeDropTable, setIncludeDropTable] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate preview batch (first 10 rows for instant live preview)
  const previewData = useMemo(() => {
    return generateDataSet(columns, 10);
  }, [columns]);

  // Full exported dataset string
  const exportedOutput = useMemo(() => {
    const fullData = generateDataSet(columns, Math.min(rowCount, 5000));
    const config: ExportConfig = {
      format,
      rowCount,
      tableName,
      sqlDialect,
      includeDropTable,
      locale: 'pt-BR'
    };
    return exportFormattedData(fullData, columns, config);
  }, [columns, rowCount, format, sqlDialect, tableName, includeDropTable]);

  const handleAddColumn = () => {
    const newCol: ColumnDefinition = {
      id: `col_${Date.now()}`,
      title: `campo_${columns.length + 1}`,
      type: 'sentence',
      nullPercentage: 0
    };
    setColumns([...columns, newCol]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleUpdateColumn = (id: string, updates: Partial<ColumnDefinition>) => {
    setColumns(columns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(exportedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportedOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extMap: Record<ExportFormat, string> = {
      sql: 'sql',
      json: 'json',
      csv: 'csv',
      xml: 'xml',
      tsv: 'tsv'
    };
    a.download = `${tableName || 'dados_teste'}.${extMap[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadPreset = (preset: 'ecommerce' | 'crm' | 'finance') => {
    if (preset === 'ecommerce') {
      setTableName('produtos');
      setColumns([
        { id: '1', title: 'id', type: 'autoincrement', nullPercentage: 0 },
        { id: '2', title: 'codigo_produto', type: 'custom_regex', nullPercentage: 0, options: { regexFormat: 'PRD-####' } },
        { id: '3', title: 'nome', type: 'sentence', nullPercentage: 0 },
        { id: '4', title: 'preco', type: 'decimal', nullPercentage: 0, options: { min: 10, max: 2000, decimals: 2 } },
        { id: '5', title: 'estoque', type: 'integer', nullPercentage: 0, options: { min: 0, max: 500 } },
        { id: '6', title: 'categoria', type: 'custom_list', nullPercentage: 0, options: { customValues: ['Eletrônicos', 'Vestuário', 'Móveis', 'Livros'] } },
        { id: '7', title: 'em_promocao', type: 'boolean', nullPercentage: 0 }
      ]);
    } else if (preset === 'crm') {
      setTableName('clientes');
      setColumns([
        { id: '1', title: 'uuid', type: 'uuid', nullPercentage: 0 },
        { id: '2', title: 'nome', type: 'name_full', nullPercentage: 0 },
        { id: '3', title: 'email', type: 'email', nullPercentage: 0 },
        { id: '4', title: 'cpf', type: 'cpf', nullPercentage: 0 },
        { id: '5', title: 'empresa', type: 'company_name', nullPercentage: 20 },
        { id: '6', title: 'cidade', type: 'address_city', nullPercentage: 0 },
        { id: '7', title: 'estado', type: 'address_state', nullPercentage: 0 }
      ]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        title="GenerateData"
        description="Gerador open-source de massa de dados e schemas para testes de banco de dados, APIs e testes automatizados."
        icon={Database}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => setIsImporterOpen(true)}
            >
              Importar Modelo (.json, .csv, .xlsx)
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownload}
            >
              Baixar {rowCount} Registros
            </Button>
          </div>
        }
      />

      {/* Top Configuration & Control Bar */}
      <Card className="p-5 bg-zinc-900/90 border-zinc-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome da Tabela / Entidade</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="ex: usuarios"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Formato de Saída</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="sql">SQL (INSERT Statement)</option>
              <option value="json">JSON Array</option>
              <option value="csv">CSV (Comma-Separated)</option>
              <option value="xml">XML Document</option>
              <option value="tsv">TSV (Tab-Separated)</option>
            </select>
          </div>

          {format === 'sql' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Dialeto SQL</label>
              <select
                value={sqlDialect}
                onChange={(e) => setSqlDialect(e.target.value as SqlDialect)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="postgres">PostgreSQL</option>
                <option value="mysql">MySQL / MariaDB</option>
                <option value="oracle">Oracle SQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Qtd. Linhas para Exportar</label>
            <select
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={10}>10 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={500}>500 registros</option>
              <option value={1000}>1.000 registros</option>
              <option value={5000}>5.000 registros</option>
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">Modelos Prontos:</span>
            <button
              onClick={() => handleLoadPreset('crm')}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              👤 Clientes / CRM
            </button>
            <button
              onClick={() => handleLoadPreset('ecommerce')}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              🛒 E-Commerce / Produtos
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDropTable}
                onChange={(e) => setIncludeDropTable(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-800 text-indigo-600 focus:ring-0"
              />
              <span>Incluir <code>DROP TABLE IF EXISTS</code></span>
            </label>
          </div>
        </div>
      </Card>

      {/* Main Grid Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column Definition Editor (7 cols) */}
        <Card className="lg:col-span-7 p-5 bg-zinc-900/90 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-white">Estrutura das Colunas ({columns.length})</h3>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={handleAddColumn}
            >
              Adicionar Coluna
            </Button>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {columns.map((col, index) => (
              <div
                key={col.id}
                className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-zinc-700 transition"
              >
                {/* Column Name Input */}
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    value={col.title}
                    onChange={(e) => handleUpdateColumn(col.id, { title: e.target.value })}
                    placeholder="Nome da coluna"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Data Type Select */}
                <div className="flex-1 min-w-[160px]">
                  <select
                    value={col.type}
                    onChange={(e) => handleUpdateColumn(col.id, { type: e.target.value as DataTypeKey })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                  >
                    {DATA_TYPES.map((dt) => (
                      <option key={dt.key} value={dt.key}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Null Percentage Input */}
                <div className="w-20 text-center">
                  <span className="text-[10px] text-zinc-500 block">Nulos (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={col.nullPercentage}
                    onChange={(e) => handleUpdateColumn(col.id, { nullPercentage: Math.min(100, Math.max(0, Number(e.target.value))) })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-xs text-center text-zinc-300 focus:outline-none"
                  />
                </div>

                {/* Remove Column */}
                <button
                  onClick={() => handleRemoveColumn(col.id)}
                  disabled={columns.length <= 1}
                  className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-30 rounded-lg hover:bg-zinc-800 transition"
                  title="Remover coluna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Live Preview & Code View (5 cols) */}
        <Card className="lg:col-span-5 p-5 bg-zinc-900/90 border-zinc-800 flex flex-col h-[600px]">
          {/* Header Tabs */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'preview' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Table className="w-4 h-4" />
                Preview Tabela (10 amostras)
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'code' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileCode className="w-4 h-4" />
                Código Gerado
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopyCode}
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
            {activeTab === 'preview' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase font-mono text-[10px]">
                    <tr>
                      {columns.map(c => (
                        <th key={c.id} className="p-2 border-b border-zinc-800 whitespace-nowrap">{c.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx} className="border-b border-zinc-800/40 hover:bg-zinc-900/50 font-mono">
                        {columns.map(c => (
                          <td key={c.id} className="p-2 whitespace-nowrap text-zinc-300">
                            {row[c.title] === null ? (
                              <span className="text-zinc-600 italic">null</span>
                            ) : (
                              String(row[c.title])
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                {exportedOutput}
              </pre>
            )}
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      <SchemaImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImport={(importedCols) => {
          setColumns(importedCols);
        }}
      />
    </div>
  );
}
