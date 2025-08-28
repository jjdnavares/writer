import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { deleteContent, getGeneratedContents } from "@/lib/history";
import { getLLMApiKey } from "@/lib/llm";
import { WriterSettings } from "./components/writer-settings";
import { GeneratedContent } from "./components/generated-content";
import { HistoryPage } from "./pages/History";
import { LLMSettings } from "./components/llm-settings";
import { useLLMProviders } from "@/hooks/useLLMProviders";
import { useLLMModels } from "@/hooks/useLLMModels";

export interface Content {
  name: string;
  title: string;
  content?: string;
  generated_text?: string;
  prompt: string;
  keyword: string;
  tone: string;
  content_type: string;
  creation: string;
}

function WriterPage() {
  const location = useLocation();
  const [activeContent, setActiveContent] = useState<Content | null>(location.state?.activeContent || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // LLM state
  const [provider, setProvider] = useState("");
  const [model, setModel] = useState("");
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [apiKeyError, setApiKeyError] = useState('');
  const [isLLMSettingsExpanded, setIsLLMSettingsExpanded] = useState(true);

  const { providers } = useLLMProviders();
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

  useEffect(() => {
    if (provider) {
      const fetchApiKey = async () => {
        const response = await getLLMApiKey(provider);
        if (response.message?.api_key) {
          setApiKeys(prev => ({ ...prev, [provider]: response.message.api_key }));
          setApiKeyError('');
        } else {
          setApiKeyError('API key not found. Please enter your API key.');
        }
      };
      fetchApiKey();
    }
  }, [provider]);

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setModel('');
    
    // Fetch API key for the new provider immediately
    try {
      const response = await getLLMApiKey(newProvider);
      if (response.message?.api_key) {
        setApiKeys(prev => ({ ...prev, [newProvider]: response.message.api_key }));
        setApiKeyError('');
      } else {
        setApiKeyError('API key not found. Please enter your API key.');
      }
    } catch (error) {
      console.error('Error fetching API key for new provider:', error);
      setApiKeyError('Failed to fetch API key. Please enter it manually.');
    }
  };

  const onContentGenerated = async (generatedContent: Content | null = null) => {
    setIsGenerating(false);
    setGenerationError(null);
    if (generatedContent) {
      // If content is passed directly, use it
      setActiveContent(generatedContent);
    } else {
      // Otherwise fetch the latest content
      const response = await getGeneratedContents();
      if (response.message && response.message.length > 0) {
        setActiveContent(response.message[0]);
      }
    }
  };
  
  const handleGenerateStart = () => {
    setIsGenerating(true);
    setGenerationError(null);
  };
  
  const handleGenerateError = (error: string) => {
    setIsGenerating(false);
    setGenerationError(error);
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
          models={models}
          selectedProvider={provider}
          selectedModel={model}
          onProviderChange={handleProviderChange}
          onModelChange={setModel}
          isLoadingModels={isLoadingModels}
          modelError={modelError || ''}
          apiKey={apiKeys[provider] || ''}
          onApiKeyChange={(key) => setApiKeys(prev => ({ ...prev, [provider]: key }))}
          apiKeyError={apiKeyError}
        />
        <WriterSettings 
          onGenerate={onContentGenerated} 
          onGenerateStart={handleGenerateStart} 
          onError={handleGenerateError}
          provider={provider} 
          model={model} 
        />
      </div>
      <div className="lg:col-span-2">
        <GeneratedContent
          activeContent={activeContent}
          onDelete={handleDelete}
          isLoading={isGenerating}
          error={generationError}
        />
      </div>
    </main>
  );
}

function AppNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  return (
    <nav className="flex border-b w-full justify-center">
      <Link 
        to="/" 
        className={`py-2 px-4 ${currentPath === '/' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
      >
        Writer
      </Link>
      <Link 
        to="/history" 
        className={`py-2 px-4 ${currentPath === '/history' ? 'border-b-2 border-primary font-semibold' : 'text-muted-foreground'}`}
      >
        History
      </Link>
    </nav>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">Content Writer</h1>
          <AppNavigation />
        </header>
        <Routes>
          <Route path="/" element={<WriterPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
