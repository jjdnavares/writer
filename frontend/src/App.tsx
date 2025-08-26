import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { deleteContent } from "@/lib/frappe";
import { WriterSettings } from "./components/writer-settings";
import { GeneratedContent } from "./components/generated-content";
import { HistoryPage } from "./pages/History";
import { LLMSettings } from "./components/llm-settings";
import { useLLMProviders } from "@/hooks/useLLMProviders";
import { useLLMModels } from "@/hooks/useLLMModels";

export interface Content {
  name: string;
  title: string;
  content: string;
  prompt: string;
  keyword: string;
  tone: string;
  content_type: string;
  creation: string;
}

function WriterPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeContent, setActiveContent] = useState<Content | null>(location.state?.activeContent || null);

  // LLM state
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isLLMSettingsExpanded, setIsLLMSettingsExpanded] = useState(false);

  const { providers, isLoading: isLoadingProviders, error: providerError } = useLLMProviders();
  const { models, isLoading: isLoadingModels, error: modelError } = useLLMModels({ provider, apiKeys });

  useEffect(() => {
    if (providers.length > 0 && !provider) {
      setProvider(providers[0].name);
    }
  }, [providers, provider]);

  useEffect(() => {
    if (models.length > 0 && !model) {
      setModel(models[0].name);
    }
  }, [models, model]);

  const onContentGenerated = async () => {
    navigate('/history');
  };

  const handleDelete = async (name: string) => {
    await deleteContent(name);
    if (activeContent && activeContent.name === name) {
      setActiveContent(null);
    }
  };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 space-y-8">
                <LLMSettings
          isExpanded={isLLMSettingsExpanded}
          setIsExpanded={setIsLLMSettingsExpanded}

          providers={providers}
          models={models}
          selectedProvider={provider}
          selectedModel={model}
          apiKey={apiKeys[provider] || ''}
          onProviderChange={setProvider}
          onModelChange={setModel}
          onApiKeyChange={(key) => setApiKeys(prev => ({ ...prev, [provider]: key }))}
          isLoadingProviders={isLoadingProviders}
          isLoadingModels={isLoadingModels}
          providerError={providerError || ''}
          modelError={modelError || ''}
          apiKeyError={''}
        />
        <WriterSettings onGenerate={onContentGenerated} provider={provider} model={model} />
      </div>
      <div className="lg:col-span-2">
        <GeneratedContent
          activeContent={activeContent}
          onDelete={handleDelete}
        />
      </div>
    </main>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between gap-2 mb-8">
            <h1 className="text-3xl font-bold">SEO Content Writer</h1>
            <nav className="flex border-b">
              <Link to="/" className="py-2 px-4 border-b-2 border-primary font-semibold">Writer</Link>
              <Link to="/history" className="py-2 px-4 text-muted-foreground">History</Link>
            </nav>
          </header>
          <Routes>
            <Route path="/" element={<WriterPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
