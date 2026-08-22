
import React, { useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface HtmlLivePreviewProps {
  code: string;
}

const HtmlLivePreview: React.FC<HtmlLivePreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updateIframe = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  };

  useEffect(() => {
    updateIframe();
  }, [code]);

  return (
    <div className="flex flex-col h-full w-full bg-white relative group">
      <div className="absolute top-2 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={updateIframe}
          className="p-2 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg shadow-sm border border-slate-200 transition-colors"
          title="Recarregar Frame"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      
      {/* 
        Sandbox permissions:
        - allow-scripts: Permite JS
        - allow-same-origin: Necessário para alguns comportamentos de DOM, mas cuidado (aqui é seguro pois é conteúdo do usuário)
        - allow-modals: Permite alerts/prompts
      */}
      <iframe
        ref={iframeRef}
        title="Live Preview"
        className="w-full h-full border-none bg-white"
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" 
      />
    </div>
  );
};

export default HtmlLivePreview;
