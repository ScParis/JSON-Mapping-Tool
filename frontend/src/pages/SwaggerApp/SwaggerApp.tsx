import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PETSTORE_YAML, TEMPLATES } from './constants';
import { OpenApiSpec, ParseError, AuthState } from './types';
import { parseOpenApiSpec, formatSpec, convertToJson, convertToYaml, isJsonString } from './utils/parser';
import { downloadFile, openApiToPostmanCollection } from './utils/exporter';
import { SwaggerToolbar } from './components/SwaggerToolbar';
import { SwaggerEditor } from './components/SwaggerEditor';
import { SwaggerPreview } from './components/SwaggerPreview';
import { AuthorizeModal } from './components/AuthorizeModal';
import { TypeScriptGeneratorModal } from './components/TypeScriptGeneratorModal';
import { AiSwaggerModal } from './components/AiSwaggerModal';

const STORAGE_KEY_SPEC = 'nexora_swagger_spec_v1';
const STORAGE_KEY_AUTH = 'nexora_swagger_auth_v1';

export const SwaggerApp: React.FC = () => {
  const navigate = useNavigate();

  // Load initial spec from localStorage or default
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPEC);
      return saved || PETSTORE_YAML;
    } catch {
      return PETSTORE_YAML;
    }
  });

  // Auth State
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      type: 'bearer',
      bearerToken: '',
      apiKeyName: 'api_key',
      apiKeyValue: '',
      apiKeyIn: 'header',
      basicUsername: '',
      basicPassword: '',
      customHeaders: {}
    };
  });

  const [baseUrl, setBaseUrl] = useState<string>('https://petstore3.swagger.io/api/v3');
  const [viewMode, setViewMode] = useState<'split' | 'editor' | 'preview'>('split');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isTsModalOpen, setIsTsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark' | 'midnight'>(() => {
    return (localStorage.getItem('portal-theme') as any) || 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme((localStorage.getItem('portal-theme') as any) || 'light');
    };
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  // Auto-detect language
  const language: 'yaml' | 'json' = isJsonString(content) ? 'json' : 'yaml';

  // Parse Spec
  const { spec, error } = useMemo(() => {
    return parseOpenApiSpec(content);
  }, [content]);

  // Update default baseUrl when spec servers change
  useEffect(() => {
    if (spec?.servers?.[0]?.url) {
      setBaseUrl(spec.servers[0].url);
    } else if (spec?.host) {
      setBaseUrl(`https://${spec.host}${spec.basePath || ''}`);
    }
  }, [spec]);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPEC, content);
    } catch (e) {
      console.error('Falha ao salvar especificação:', e);
    }
  }, [content]);

  const handleSaveAuth = (newAuth: AuthState) => {
    setAuth(newAuth);
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newAuth));
    } catch (e) {
      console.error('Falha ao salvar auth:', e);
    }
  };

  // Actions
  const handleFormat = () => {
    const res = formatSpec(content, language);
    if (res.formatted) {
      setContent(res.formatted);
    }
  };

  const handleConvertToYaml = () => {
    const res = convertToYaml(content);
    if (res.yaml) {
      setContent(res.yaml);
    }
  };

  const handleConvertToJson = () => {
    const res = convertToJson(content);
    if (res.json) {
      setContent(res.json);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
    }
  };

  const handleOpenFile = (fileContent: string, _filename: string) => {
    setContent(fileContent);
  };

  const handleDownloadYaml = () => {
    const res = convertToYaml(content);
    const yamlContent = res.yaml || content;
    const title = (spec?.info?.title || 'openapi-spec').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadFile(yamlContent, `${title}.yaml`, 'text/yaml');
  };

  const handleDownloadJson = () => {
    const res = convertToJson(content);
    const jsonContent = res.json || content;
    const title = (spec?.info?.title || 'openapi-spec').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadFile(jsonContent, `${title}.json`, 'application/json');
  };

  const handleExportPostman = () => {
    if (!spec) return;
    const postman = openApiToPostmanCollection(spec);
    const title = (spec?.info?.title || 'api').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadFile(JSON.stringify(postman, null, 2), `${title}.postman_collection.json`, 'application/json');
  };

  const handleSendToJsonMapper = (data: any) => {
    try {
      sessionStorage.setItem('nexora_json_import', JSON.stringify(data));
      navigate('/json');
    } catch (e) {
      console.error('Erro ao repassar dados para o JSON Mapper:', e);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-[#030711]">
      {/* Top Toolbar */}
      <SwaggerToolbar
        language={language}
        onFormat={handleFormat}
        onConvertToYaml={handleConvertToYaml}
        onConvertToJson={handleConvertToJson}
        onLoadTemplate={handleLoadTemplate}
        onOpenFile={handleOpenFile}
        onDownloadYaml={handleDownloadYaml}
        onDownloadJson={handleDownloadJson}
        onExportPostman={handleExportPostman}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenTsModal={() => setIsTsModalOpen(true)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        auth={auth}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Editor */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div
            className={`h-full border-r border-zinc-200 dark:border-slate-800 transition-all ${
              viewMode === 'editor' ? 'w-full' : 'w-full lg:w-1/2'
            }`}
          >
            <SwaggerEditor
              value={content}
              onChange={setContent}
              language={language}
              error={error}
              theme={theme === 'light' ? 'vs' : 'vs-dark'}
            />
          </div>
        )}

        {/* Right: Interactive Live Documentation */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            className={`h-full overflow-hidden transition-all ${
              viewMode === 'preview' ? 'w-full' : 'w-full lg:w-1/2'
            }`}
          >
            <SwaggerPreview
              spec={spec}
              error={error?.message || null}
              baseUrl={baseUrl}
              onChangeBaseUrl={setBaseUrl}
              auth={auth}
              onSendToJsonMapper={handleSendToJsonMapper}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AuthorizeModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        auth={auth}
        onSave={handleSaveAuth}
      />

      <TypeScriptGeneratorModal
        isOpen={isTsModalOpen}
        onClose={() => setIsTsModalOpen(false)}
        spec={spec}
      />

      <AiSwaggerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentSpec={content}
        onApplySpec={setContent}
      />
    </div>
  );
};

export default SwaggerApp;
