import React, { useState } from 'react';
import { Search, Building2, MapPin, Copy, Check, Info } from 'lucide-react';
import { PageHeader, Card, Button, Input, Badge } from '../../components/ui';
import { BACKEND_URL } from '../../config';

const fieldLabels: Record<string, string> = {
    abertura: "Data de Abertura",
    situacao: "Situação",
    tipo: "Tipo",
    nome: "Nome Empresarial",
    fantasia: "Nome Fantasia",
    porte: "Porte",
    natureza_juridica: "Natureza Jurídica",
    logradouro: "Logradouro",
    numero: "Número",
    complemento: "Complemento",
    cep: "CEP",
    bairro: "Bairro",
    municipio: "Município",
    uf: "UF",
    email: "E-mail",
    telefone: "Telefone",
    efr: "EFR",
    motivo_situacao: "Motivo Situação",
    situacao_especial: "Situação Especial",
    data_situacao_especial: "Data Situação Especial",
    capital_social: "Capital Social",
    ultima_atualizacao: "Última Atualização",
    status: "Status (API)",
    cnpj: "CNPJ (Consultado)",
    qsa: "Quadro de Sócios e Administradores",
    atividade_principal: "Atividade Principal",
    atividades_secundarias: "Atividades Secundárias",
    code: "Código",
    text: "Descrição",
    qual: "Qualificação",
};

// Utils: Masks & Validators
const applyCNPJMask = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 14);
    return numbers.replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

const applyCEPMask = (value: string) => {
    const numbers = value.replace(/\D/g, '').substring(0, 8);
    return numbers.replace(/^(\d{5})(\d)/, '$1-$2');
};

const isValidCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
};

// Reusable Copy Field Component with animated pill-badge feedback
const CopyField = ({ label, value }: { label: string, value: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-3 bg-base/50 dark:bg-panel/40 rounded-xl border border-base/80 transition-all hover:bg-panel hover:shadow-md hover:border-indigo-500/30 group flex flex-col justify-between min-h-[72px]">
            <div className="text-[10px] font-extrabold text-muted uppercase tracking-widest mb-1.5">
                {label}
            </div>
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-primary truncate cursor-text select-all" title={value || "N/A"}>
                    {value || "N/A"}
                </span>
                <div className="flex-shrink-0 flex items-center min-w-[24px] justify-end">
                    {copied ? (
                        <Badge variant="success" size="sm">Copiado!</Badge>
                    ) : (
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-lg text-muted hover:text-indigo-500 hover:bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                            title="Copiar para área de transferência"
                        >
                            <Copy size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Skeleton Loader components for polished feedback
const CnpjSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="p-3 bg-base/40 rounded-xl border border-base/60 flex flex-col gap-2 justify-center min-h-[72px]">
                <div className="h-2.5 w-24 bg-muted/20 rounded-full"></div>
                <div className="h-4 w-40 bg-muted/30 rounded-full"></div>
            </div>
        ))}
    </div>
);

const CepSkeleton = () => (
    <div className="space-y-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 bg-base/40 rounded-xl border border-base/60 flex flex-col gap-2 justify-center min-h-[72px]">
                <div className="h-2.5 w-16 bg-muted/20 rounded-full"></div>
                <div className="h-4 w-48 bg-muted/30 rounded-full"></div>
            </div>
        ))}
    </div>
);

export default function CnpjApp() {
    const [cnpjStr, setCnpjStr] = useState('');
    const [cepStr, setCepStr] = useState('');

    const [cnpjData, setCnpjData] = useState<any>(null);
    const [cnpjLoading, setCnpjLoading] = useState(false);
    const [cnpjError, setCnpjError] = useState('');

    const [cepData, setCepData] = useState<any>(null);
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState('');

    const handleCnpjSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCnpj = cnpjStr.replace(/\D/g, '');

        if (!isValidCNPJ(cleanCnpj)) {
            setCnpjError('CNPJ inválido. Verifique o número e tente novamente.');
            setCnpjData(null);
            return;
        }

        setCnpjError('');
        setCnpjLoading(true);
        setCnpjData(null);

        try {
            const response = await fetch(`${BACKEND_URL}/api/cnpj/${cleanCnpj}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro na consulta');
            }

            setCnpjData(data);
        } catch (err: any) {
            setCnpjError(err.message || 'Erro de conexão com o servidor.');
        } finally {
            setCnpjLoading(false);
        }
    };

    const handleCepSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCep = cepStr.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            setCepError('CEP inválido. Deve conter 8 dígitos.');
            setCepData(null);
            return;
        }

        setCepError('');
        setCepLoading(true);
        setCepData(null);

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('CEP não encontrado.');
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao consultar CEP.');
            }
            const data = await response.json();
            setCepData(data);
        } catch (err: any) {
            setCepError(err.message || 'Erro ao buscar o CEP.');
        } finally {
            setCepLoading(false);
        }
    };

    // Recursive CNPJ renderer
    const renderCnpjData = (data: any, prefix = ''): React.ReactNode => {
        if (!data) return null;

        return Object.entries(data).map(([key, value]) => {
            const label = fieldLabels[key] || key.replace(/_/g, ' ').toUpperCase();

            if (typeof value === 'object' && value !== null) {
                if (Array.isArray(value)) {
                    if (value.length === 0) return null;
                    return (
                        <div key={key} className="col-span-full mt-6">
                            <h3 className="text-sm font-bold text-indigo-500 mb-4 pb-2 border-b border-base/80 uppercase tracking-wider">{label}</h3>
                            <div className="space-y-4">
                                {value.map((item, index) => (
                                    <div key={index} className="pl-4 border-l-2 border-indigo-500/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {typeof item === 'object'
                                                ? renderCnpjData(item)
                                                : <CopyField label={`${label} ${index + 1}`} value={item} />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                return renderCnpjData(value, `${prefix}${key}.`);
            }
            return <CopyField key={`${prefix}${key}`} label={label} value={String(value)} />;
        });
    };

    return (
        <div className="ds-container flex-1">
            <PageHeader
                title="Consulta CNPJ & CEP"
                description="Consulte dados cadastrais corporativos da Receita Federal e endereços dos Correios instantaneamente."
                icon={Building2}
                badge="APIs & Webhooks"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* CNPJ Section */}
                <Card variant="glass" padding="none">
                    <div className="p-6 border-b border-base/80 bg-base/20">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                <Building2 size={18} />
                            </div>
                            Pesquisar CNPJ
                        </h2>
                        <form onSubmit={handleCnpjSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="00.000.000/0000-00"
                                    value={cnpjStr}
                                    onChange={e => setCnpjStr(applyCNPJMask(e.target.value))}
                                    required
                                />
                            </div>
                            <Button type="submit" isLoading={cnpjLoading} variant="primary" size="md">
                                Consultar
                            </Button>
                        </form>
                        {cnpjError && (
                            <div className="mt-4 text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-semibold flex items-center gap-2">
                                <Info size={14} className="shrink-0" />
                                {cnpjError}
                            </div>
                        )}
                    </div>

                    <div className="p-6 min-h-[250px] flex flex-col justify-center">
                        {cnpjLoading ? (
                            <CnpjSkeleton />
                        ) : cnpjData ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderCnpjData(cnpjData)}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner">
                                    <Building2 size={28} className="opacity-80" />
                                </div>
                                <h4 className="text-sm font-bold text-primary mb-1">Pronto para Consultar</h4>
                                <p className="text-xs text-muted max-w-[260px] mx-auto leading-relaxed">Insira um CNPJ acima para buscar informações cadastrais corporativas atualizadas.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* CEP Section */}
                <Card variant="glass" padding="none">
                    <div className="p-6 border-b border-base/80 bg-base/20">
                        <h2 className="text-lg font-bold text-primary flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <MapPin size={18} />
                            </div>
                            Pesquisar CEP
                        </h2>
                        <form onSubmit={handleCepSearch} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="00000-000"
                                    value={cepStr}
                                    onChange={e => setCepStr(applyCEPMask(e.target.value))}
                                    required
                                />
                            </div>
                            <Button type="submit" isLoading={cepLoading} variant="primary" size="md">
                                Consultar
                            </Button>
                        </form>
                        {cepError && (
                            <div className="mt-4 text-xs text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20 font-semibold flex items-center gap-2">
                                <Info size={14} className="shrink-0" />
                                {cepError}
                            </div>
                        )}
                    </div>

                    <div className="p-6 min-h-[250px] flex flex-col justify-center">
                        {cepLoading ? (
                            <CepSkeleton />
                        ) : cepData ? (
                            <div className="space-y-4">
                                <CopyField label="CEP" value={cepData.cep} />
                                <CopyField label="Rua/Logradouro" value={cepData.street} />
                                <CopyField label="Bairro" value={cepData.neighborhood} />
                                <div className="grid grid-cols-2 gap-4">
                                    <CopyField label="Cidade" value={cepData.city} />
                                    <CopyField label="UF" value={cepData.state} />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 border border-purple-500/20 shadow-inner">
                                    <MapPin size={28} className="opacity-80" />
                                </div>
                                <h4 className="text-sm font-bold text-primary mb-1">Pronto para Consultar</h4>
                                <p className="text-xs text-muted max-w-[260px] mx-auto leading-relaxed">Insira um CEP acima para buscar detalhes de localização e endereço postal.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
