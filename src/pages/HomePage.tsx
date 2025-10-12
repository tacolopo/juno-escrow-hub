import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import heroImage from "@/assets/escrow-hero.jpg";
import planetIcon from "@/assets/planet-icon.png";

const HomePage = () => {
  const navigate = useNavigate();

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
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="relative p-4 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30 animate-float">
                <img 
                  src={planetIcon} 
                  alt="Blockchain" 
                  className="h-12 w-12 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-cosmic opacity-20 rounded-xl animate-cosmic-glow"></div>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-success bg-clip-text text-transparent">
              Multi-Chain Escrow Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Secure multi-signature escrow agreements across Cosmos and Cardano blockchains
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-4 backdrop-blur-sm border border-border/50">
                <Shield className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Multi-Signature</div>
                  <div className="text-sm text-muted-foreground">2-3 approvers required</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-4 backdrop-blur-sm border border-border/50">
                <Globe className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Cross-Chain</div>
                  <div className="text-sm text-muted-foreground">Cosmos & Cardano</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-card/50 rounded-lg p-4 backdrop-blur-sm border border-border/50">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">Production Ready</div>
                  <div className="text-sm text-muted-foreground">Live on mainnet</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chain Selection */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Blockchain</h2>
            <p className="text-muted-foreground">
              Select the blockchain network you want to use for your escrow agreements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cosmos Card */}
            <Card className="card-gradient group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  Cosmos Hub
                </CardTitle>
                <CardDescription className="text-base">
                  Secure escrows on Cosmos Hub using ATOM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Native ATOM token support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>CosmWasm smart contracts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Keplr wallet integration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>IBC-enabled interchain</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/cosmos')}
                  className="w-full group-hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  Launch Cosmos App
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="text-xs text-muted-foreground text-center pt-2">
                  Contract: cosmos1zp0...y6l405
                </div>
              </CardContent>
            </Card>

            {/* Cardano Card */}
            <Card className="card-gradient group hover:scale-105 transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  Cardano
                </CardTitle>
                <CardDescription className="text-base">
                  Secure escrows on Cardano using ADA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Native ADA token support</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Plutus V2 smart contracts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Gero wallet integration</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>UTXO-based architecture</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate('/cardano')}
                  className="w-full group-hover:shadow-lg transition-shadow"
                  size="lg"
                >
                  Launch Cardano App
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <div className="text-xs text-muted-foreground text-center pt-2">
                  Script: addr1wx3...clf45nj
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-cosmic opacity-5"></div>
        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>Multi-chain escrow service powered by Cosmos & Cardano</p>
            <p className="mt-1">Production-ready smart contracts • Secure multi-signature escrows</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

