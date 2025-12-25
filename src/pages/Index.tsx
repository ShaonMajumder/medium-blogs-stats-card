import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const Index = () => {
  const [rssUrl, setRssUrl] = useState("");
  const [username, setUsername] = useState("");
  const [limit, setLimit] = useState("1");
  const [theme, setTheme] = useState("dark");
  const [showDate, setShowDate] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cardUrl, setCardUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateCard = async () => {
    if (!rssUrl.trim() && !username.trim()) {
      toast({
        title: "RSS URL or username required",
        description: "Please enter a Medium RSS feed URL or a username.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const endpointBase = API_BASE_URL
      ? `${API_BASE_URL}/api/medium-blog-card`
      : "/api/medium-blog-card";
    const params = new URLSearchParams();

    if (rssUrl.trim()) params.set("rss", rssUrl.trim());
    if (username.trim()) params.set("username", username.trim());
    if (limit.trim()) params.set("limit", limit.trim());
    params.set("theme", theme);
    params.set("show_date", String(showDate));
    params.set("show_tags", String(showTags));

    const requestUrl = `${endpointBase}?${params.toString()}`;

    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error("Failed to generate card");
      }
      const absoluteUrl = API_BASE_URL
        ? requestUrl
        : `${typeof window !== "undefined" ? window.location.origin : ""}${requestUrl}`;
      setCardUrl(absoluteUrl);
      toast({
        title: "Success!",
        description: "Your Medium blog card is ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate card. Please check the RSS URL or username.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;

    const copy = async () => {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    };

    copy();
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const markdownCode = cardUrl ? `![Latest Medium Post](${cardUrl})` : "";
  const htmlCode = cardUrl ? `<img src="${cardUrl}" alt="Latest Medium Post" />` : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0%,_hsl(var(--background))_45%,_hsl(var(--background))_100%)]">
      <div className="relative overflow-hidden">
        <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-foreground/5 blur-3xl" />
        <div className="absolute left-1/2 top-32 h-40 w-40 -translate-x-1/2 rounded-full border border-foreground/10" />

        <header className="relative z-10 border-b border-foreground/10 bg-background/70 backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background text-sm font-semibold">
                M
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Medium Toolkit</p>
                <h1 className="text-xl font-semibold">Medium Blog Stats Card</h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground md:flex">
              <span className="h-2 w-2 rounded-full bg-primary" />
              RSS to SVG
            </div>
          </div>
        </header>

        <main className="relative z-10 container mx-auto px-4 pb-16 pt-12">
          <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div className="space-y-6 animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Medium RSS → SVG
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <h2 className="font-serif text-4xl font-semibold leading-tight md:text-5xl">
                Reinvent your portfolio with a monochrome Medium card.
              </h2>
              <p className="text-lg text-muted-foreground">
                Pull your latest Medium posts, style them in a crisp black-and-white layout, and embed
                the SVG anywhere. A bold, editorial look with Medium’s signature green accents.
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div>
                  <p className="text-2xl font-semibold text-foreground">01</p>
                  <p>Paste RSS or username</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">02</p>
                  <p>Pick theme & layout</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">03</p>
                  <p>Embed in minutes</p>
                </div>
              </div>
            </div>

            <Card className="relative overflow-hidden border border-foreground/10 bg-card/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
              <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Input</p>
                  <h3 className="text-xl font-semibold">Configure your card</h3>
                </div>

                <div className="grid gap-4">
                  <Input
                    placeholder="Medium RSS feed URL (optional)"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateCard()}
                    className="h-12 text-base"
                  />
                  <Input
                    placeholder="Medium username (optional)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generateCard()}
                    className="h-12 text-base"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Limit</Label>
                    <Input
                      placeholder="1"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      type="number"
                      min="1"
                      max="5"
                      className="h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Ink</SelectItem>
                        <SelectItem value="light">Paper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Generate</Label>
                    <Button
                      onClick={generateCard}
                      disabled={isLoading}
                      size="lg"
                      className="h-12 w-full bg-foreground text-white hover:bg-foreground/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Card"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-foreground/10 bg-background/70 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Switch checked={showDate} onCheckedChange={setShowDate} />
                      <Label>Show date</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={showTags} onCheckedChange={setShowTags} />
                      <Label>Show tags</Label>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Provide a Medium RSS URL or username. Toggle dates and tags for a clean editorial
                  look.
                </p>
              </div>
            </Card>
          </section>

          {cardUrl && (
            <section className="mt-14 space-y-6">
              <Card className="border border-foreground/10 bg-card/90 p-8">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-foreground" />
                  Preview
                </div>
                <div className="mt-6 rounded-2xl border border-foreground/10 bg-background/80 p-6">
                  <img src={cardUrl} alt="Latest Medium Post" className="mx-auto max-w-full" />
                </div>
              </Card>

              <Card className="border border-foreground/10 bg-card/90 p-8">
                <h3 className="text-xl font-semibold">Embed Code</h3>

                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">Markdown</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(markdownCode)}
                        className="h-8"
                      >
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-foreground" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <code className="mt-2 block w-full rounded-2xl border border-foreground/10 bg-background/80 p-3 text-sm font-mono break-all">
                      {markdownCode}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">HTML</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(htmlCode)}
                        className="h-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="mt-2 block w-full rounded-2xl border border-foreground/10 bg-background/80 p-3 text-sm font-mono break-all">
                      {htmlCode}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-muted-foreground">Direct URL</label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(cardUrl)}
                        className="h-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <code className="mt-2 block w-full rounded-2xl border border-foreground/10 bg-background/80 p-3 text-sm font-mono break-all">
                      {cardUrl}
                    </code>
                  </div>
                </div>
              </Card>
            </section>
          )}

          <section className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              {
                label: "Editorial layout",
                title: "Minimal by design",
                body: "Black-and-white baseline with Medium green highlights.",
              },
              {
                label: "RSS powered",
                title: "Always current",
                body: "Pulls the latest posts from your Medium feed automatically.",
              },
              {
                label: "Embed-ready",
                title: "Copy in seconds",
                body: "Markdown, HTML, or raw URLs ready for any profile.",
              },
            ].map((item) => (
              <Card
                key={item.label}
                className="flex h-full flex-col justify-between border border-foreground/10 bg-card/90 p-6"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                <div className="mt-4 space-y-2">
                  <h4 className="text-lg font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.body}</p>
                </div>
                <div className="mt-6 h-1 w-12 rounded-full bg-primary/70" />
              </Card>
            ))}
          </section>
        </main>

        <footer className="relative z-10 border-t border-foreground/10 bg-background/70">
          <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row">
            <p className="text-center md:text-left">
              Built by{" "}
              <a
                href="https://shaonresume.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground hover:underline"
              >
                Shaon Majumder
              </a>{" "}
              — Senior Software Engineer (AI &amp; Scalability)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
              <a
                href="https://www.linkedin.com/in/shaonmajumder"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                LinkedIn
              </a>
              <a
                href="https://github.com/ShaonMajumder"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                GitHub
              </a>
              <a
                href="https://medium.com/@shaonmajumder"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                Medium
              </a>
              <a
                href="https://shaonresume.netlify.app"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                Portfolio
              </a>
              <a
                href="https://docs.google.com/document/d/1frKGGkaE1nG9G8mTkxUoPfcU0jppSZYOy4VMPTlIb-Y/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground hover:underline"
              >
                Resume
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
