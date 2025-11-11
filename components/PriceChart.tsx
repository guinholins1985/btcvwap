import React from 'react';
import type { SignalDetails } from '../types';

interface QualitativeAnalysisCardProps {
    signalDetails: SignalDetails | null;
}

const QualitativeAnalysisCard: React.FC<QualitativeAnalysisCardProps> = ({ signalDetails }) => {

    const getAnalysisText = () => {
        if (!signalDetails) {
            return { title: 'Aguardando Análise', text: 'Os dados de mercado estão sendo processados para gerar uma nova análise qualitativa.' };
        }

        switch(signalDetails.signal) {
            case 'COMPRA':
                return { 
                    title: 'Perspectiva de Compra / Manter Posição', 
                    text: 'O sinal de COMPRA foi ativado pela confluência de um RSI em sobrevenda e uma confirmação de momentum de alta pelo Heikin-Ashi. Isso sugere uma potencial exaustão da força vendedora e o início de uma reversão de curto prazo. Monitore os níveis de resistência (R1, R2) como alvos iniciais.' 
                };
            case 'VENDA':
                return { 
                    title: 'Perspectiva de Venda / Realização de Lucro', 
                    text: 'Um sinal de VENDA foi gerado devido ao RSI indicar sobrecompra, com o Heikin-Ashi confirmando a perda de força compradora. Esta configuração aponta para um possível topo local e uma oportunidade de venda ou realização de lucros para posições compradas. Os níveis de suporte (S1, S2) são os próximos alvos para o preço.'
                };
            case 'MANTER':
                return { 
                    title: 'Perspectiva de Manter / Observação', 
                    text: 'O sinal atual é MANTER, indicando um mercado em consolidação ou com sinais conflitantes. O RSI não está em extremos e não há uma confirmação clara do Heikin-Ashi. A melhor estratégia é aguardar um sinal mais claro, monitorando a ação do preço nos níveis de suporte e resistência mais próximos antes de tomar uma decisão.' 
                };
            default:
                return { title: 'Análise Indisponível', text: 'Não foi possível gerar a análise qualitativa no momento.' };
        }
    };

    const { title, text } = getAnalysisText();

    return (
        <div className="bg-shark p-6 rounded-lg shadow-lg border border-tuna">
            <h2 className="text-xl font-bold text-white mb-4">Análise Qualitativa</h2>
            <div className="bg-bunker p-4 rounded-md">
                <h3 className="font-semibold text-spindle mb-2">{title}</h3>
                <p className="text-nevada text-base">{text}</p>
            </div>
            <div className="bg-bunker p-4 rounded-md mt-4">
                <h3 className="font-semibold text-spindle mb-2">Sugestão de Entrada (Próximo D1)</h3>
                <p className="text-nevada text-base">Para uma entrada estratégica no próximo dia, considere posicionar uma ordem limite perto do Pivot Point diário, aguardando um reteste do nível antes de o preço continuar sua tendência.</p>
            </div>
        </div>
    );
};

export default QualitativeAnalysisCard;
