import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Rocket } from "lucide-react";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";

const Home = () => {
  const navigate = useNavigate();
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  const chains = [
    {
      id: "cosmos",
      name: "Cosmos Hub",
      description: "Secure escrows on the Internet of Blockchains",
      icon: "🌌",
      color: "from-primary via-primary/90 to-success",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/30",
      hoverBg: "hover:bg-primary/10",
      currency: "ATOM",
      path: "/cosmos"
    },
    {
      id: "solana",
      name: "Solana",
      description: "High-performance escrows on Solana with native speed",
      icon: "◎",
      color: "from-purple-500 via-purple-600 to-pink-500",
      bgColor: "bg-purple-500/5",
      borderColor: "border-purple-500/30",
      hoverBg: "hover:bg-purple-500/10",
      currency: "SOL",
      path: "/solana"
    },
    {
      id: "cardano",
      name: "Cardano",
      description: "Multi-signature escrows with Plutus smart contracts",
      icon: "₳",
      color: "from-blue-500 via-blue-600 to-cyan-500",
      bgColor: "bg-blue-500/5",
      borderColor: "border-blue-500/30",
      hoverBg: "hover:bg-blue-500/10",
      currency: "ADA",
      path: "/cardano"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header 
        className="relative border-b border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(240, 240, 240, 0.02), rgba(240, 240, 240, 0.02)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm"></div>
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative p-4 rounded-2xl bg-primary/20 backdrop-blur-sm border border-primary/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Escrow Hub" 
                  className="h-16 w-16 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-cosmic opacity-20 rounded-2xl animate-cosmic-glow"></div>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/90 to-success bg-clip-text text-transparent">
              Multi-Chain Escrow Hub
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure, decentralized escrow services across multiple blockchain ecosystems. 
              Choose your network and start creating trustless agreements.
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Multi-signature • Trustless • Decentralized</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chain Selection */}
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">Choose Your Network</h2>
            <p className="text-muted-foreground">
              Select a blockchain network to create and manage escrows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {chains.map((chain) => (
              <Card
                key={chain.id}
                className={`card-gradient relative overflow-hidden transition-all duration-300 cursor-pointer ${
                  hoveredChain === chain.id ? 'transform scale-105 shadow-xl' : ''
                } ${chain.bgColor} border-2 ${chain.borderColor} ${chain.hoverBg}`}
                onMouseEnter={() => setHoveredChain(chain.id)}
                onMouseLeave={() => setHoveredChain(null)}
                onClick={() => navigate(chain.path)}
              >
                <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
                
                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-5xl ${chain.id === 'cardano' ? 'font-bold' : ''}`}>
                      {chain.icon}
                    </div>
                    <div className={`px-3 py-1 rounded-full bg-background/50 backdrop-blur-sm text-xs font-medium bg-gradient-to-r ${chain.color} bg-clip-text text-transparent`}>
                      {chain.currency}
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl mb-2">
                    <span className={`bg-gradient-to-r ${chain.color} bg-clip-text text-transparent`}>
                      {chain.name}
                    </span>
                  </CardTitle>
                  
                  <CardDescription className="text-base">
                    {chain.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span>Multi-signature approvals</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span>Trustless fund management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                        <span>On-chain transparency</span>
                      </div>
                    </div>

                    <Button
                      className={`w-full transition-all duration-300 ${
                        hoveredChain === chain.id ? 'animate-pulse' : ''
                      }`}
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(chain.path);
                      }}
                    >
                      <Rocket className="mr-2 h-5 w-5" />
                      Enter {chain.name}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features Section */}
          <div className="mt-16 text-center space-y-8">
            <h3 className="text-xl font-semibold">Why Use Multi-Chain Escrow?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg">🔒 Secure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Smart contract-based escrow ensures funds are safe and can only be released with proper approvals
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg">🤝 Trustless</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No intermediaries needed. Smart contracts execute automatically based on predetermined conditions
                  </p>
                </CardContent>
              </Card>

              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="text-lg">🌐 Multi-Chain</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Choose the blockchain that best fits your needs - Cosmos or Cardano ecosystems
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Multi-chain escrow service • Cosmos Hub & Cardano networks</p>
            <p className="text-xs opacity-75">
              Secure your agreements across multiple blockchain ecosystems
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

