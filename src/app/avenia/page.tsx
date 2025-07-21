import { Metadata } from "next";
import { AveniaIntegration } from "~/components/avenia/AveniaIntegration";

export const metadata: Metadata = {
  title: "Avenia Integration | RendeX",
  description: "Connect your Avenia account for advanced financial services and KYC verification.",
};

export default function AveniaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Avenia Financial Services
            </h1>
            <p className="text-gray-600">
              Connect your Avenia account to access advanced financial services, 
              complete KYC verification, and start converting PIX to stablecoins.
            </p>
          </div>
          
          <AveniaIntegration />
        </div>
      </div>
    </div>
  );
}