import React, { useState, useMemo } from 'react';
import { Copy, Send, Trash2, Smartphone } from 'lucide-react';

const WhatsappBuilder: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [message, setMessage] = useState('');
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [utmTerm, setUtmTerm] = useState('');
    const [utmContent, setUtmContent] = useState('');
    const [appendUtm, setAppendUtm] = useState(false);

    const generatedLink = useMemo(() => {
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) return '';

        let url = `https://wa.me/${cleanPhone}?text=`;
        let msg = message;

        if (appendUtm) {
            const utmParams = [
                utmSource && `utm_source=${utmSource}`,
                utmMedium && `utm_medium=${utmMedium}`,
                utmCampaign && `utm_campaign=${utmCampaign}`,
                utmTerm && `utm_term=${utmTerm}`,
                utmContent && `utm_content=${utmContent}`,
            ].filter(Boolean).join(' | ');

            if (utmParams) {
                msg += `\n\n[Origem: ${utmParams}]`;
            }
        }

        return url + encodeURIComponent(msg);
    }, [phone, message, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, appendUtm]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink);
    };

    const handleClear = () => {
        setPhone('');
        setMessage('');
        setUtmSource('');
        setUtmMedium('');
        setUtmCampaign('');
        setUtmTerm('');
        setUtmContent('');
        setAppendUtm(false);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-modern">
            <header>
                <h1 className="text-3xl font-black text-primary tracking-tight">WhatsApp Link Builder</h1>
                <p className="text-muted mt-2">Crie links "Click to Chat" personalizados com rastreamento UTM.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <InputField label="WhatsApp (DDI+DDD+Num)" value={phone} onChange={setPhone} placeholder="5511999999999" icon={Smartphone} />
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted uppercase">Mensagem Padrão</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full bg-app p-3 rounded-xl border border-base h-32 text-sm focus:border-accent outline-none" placeholder="Olá, gostaria de saber mais..." />
                    </div>
                </div>

                <div className="space-y-4">
                    <InputField label="UTM Source" value={utmSource} onChange={setUtmSource} placeholder="instagram" />
                    <InputField label="UTM Medium" value={utmMedium} onChange={setUtmMedium} placeholder="stories" />
                    <InputField label="UTM Campaign" value={utmCampaign} onChange={setUtmCampaign} placeholder="verao2026" />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={appendUtm} onChange={e => setAppendUtm(e.target.checked)} className="accent-accent" />
                        <span className="text-sm font-medium text-primary">Anexar bloco UTM na mensagem?</span>
                    </div>
                </div>
            </div>

            <div className="bg-panel p-6 rounded-2xl border border-base space-y-4">
                <label className="text-xs font-bold text-muted uppercase">Link Gerado</label>
                <div className="flex gap-2">
                    <input type="text" value={generatedLink} readOnly className="flex-1 bg-app p-3 rounded-xl border border-base text-sm font-mono" />
                    <button onClick={handleCopy} className="p-3 bg-accent text-white rounded-xl hover:bg-accent-hover"><Copy className="w-5 h-5" /></button>
                    <a href={generatedLink} target="_blank" rel="noreferrer" className="p-3 bg-app border border-base rounded-xl hover:bg-panel"><Send className="w-5 h-5 text-accent" /></a>
                    <button onClick={handleClear} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20"><Trash2 className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

const InputField: React.FC<{ label: string, value: string, onChange: (v: string) => void, placeholder: string, icon?: any }> = ({ label, value, onChange, placeholder, icon: Icon }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-muted uppercase">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-3 w-4 h-4 text-muted" />}
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full bg-app p-3 ${Icon ? 'pl-9' : ''} rounded-xl border border-base text-sm focus:border-accent outline-none`} placeholder={placeholder} />
        </div>
    </div>
);

export default WhatsappBuilder;
