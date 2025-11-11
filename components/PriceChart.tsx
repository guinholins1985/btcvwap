import React from 'react';
import type { AnalysisResult } from '../types';

interface QualitativeAnalysisCardProps {
    geminiAnalysis: AnalysisResult | null;
    isAnalysisLoading: boolean;
}

const QualitativeAnalysisCard: React.FC<QualitativeAnalysisCardProps> = ({ geminiAnalysis, isAnalysisLoading }) => {

    return (
        <div className="bg-shark p-6 rounded-lg shadow-lg border border-tuna">
            <h2 className="text-xl font-bold text-white mb-4">Análise Qualitativa (IA)</h2>
            <div className="bg-bunker p-4 rounded-md min-h-[100px] flex flex-col justify-center">
                {isAnalysisLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-nevada text-sm">Gerando análise com IA...</p>
                    </div>
                ) : geminiAnalysis?.sentiment ? (
                    <>
                        <h3 className="font-semibold text-spindle mb-2">Sentimento de Mercado</h3>
                        <p className="text-nevada text-base">{geminiAnalysis.sentiment}</p>
                    </>
                ) : (
                    <p className="text-nevada text-base text-center">Análise da IA indisponível no momento.</p> 
                )}
            </div>
            <div className="bg-bunker p-4 rounded-md mt-4">
                <h3 className="font-semibold text-spindle mb-2">Sugestão de Estratégia</h3>
                <p className="text-nevada text-base">Para uma entrada estratégica, considere posicionar ordens limites perto de níveis chave (VWAPs, Pivots), aguardando um reteste antes do preço continuar sua tendência.</p>
            </div>
        </div>
    );
};

export default QualitativeAnalysisCard;