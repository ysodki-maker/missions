import React from 'react';
import { CreditCard, Sparkles, Zap } from 'lucide-react';

const CustomBankCards = ({ cards, selectedCard, setSelectedCard }) => {
  // Fonction pour obtenir le style de la carte selon le type
  const getCardStyle = (card) => {
    const isSelected = selectedCard?.id === card.id;
    
    // Carte Attijari - Design moderne élégant
    if (card.type === 'Attijari' || card.id === 'attijari') {
      return {
        background: 'linear-gradient(135deg, #ff6b00 0%, #ff8f1f 25%, #ffd700 50%, #ff8f1f 75%, #ff6b00 100%)',
        cardClass: 'attijari',
        textColor: 'text-white',
        labelText: 'Massarif',
        brandColor: '#ff6b00',
        isSelected: isSelected
      };
    }
    
    // Carte Afriquia - Design premium sophistiqué
    if (card.type === 'Afriquia' || card.id === 'afriquia') {
      return {
        background: 'linear-gradient(135deg, #000814 0%, #001d3d 50%, #003566 100%)',
        cardClass: 'afriquia',
        textColor: 'text-white',
        labelText: 'Free',
        brandColor: '#ffc300',
        isSelected: isSelected
      };
    }
    
    // Carte par défaut
    return {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardClass: 'default',
      textColor: 'text-white',
      brandColor: '#667eea',
      isSelected: isSelected
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 p-4">
      {cards.map((card) => {
        const style = getCardStyle(card);
        const isSelected = selectedCard?.id === card.id;
        
        return (
          <div
            key={card.id}
            onClick={() => setSelectedCard(card)}
            className={`relative cursor-pointer group transition-all duration-500 ease-out ${
              isSelected ? 'scale-105' : 'hover:scale-102'
            }`}
            style={{ perspective: '1500px' }}
          >
            {/* Aura lumineuse animée */}
            <div 
              className={`absolute -inset-4 rounded-3xl blur-2xl transition-all duration-500 ${
                isSelected ? 'opacity-60 scale-100' : 'opacity-0 scale-95 group-hover:opacity-30 group-hover:scale-100'
              }`}
              style={{ 
                background: style.brandColor,
                animation: isSelected ? 'pulse 3s ease-in-out infinite' : 'none'
              }}
            ></div>

            {/* Carte principale */}
            <div
              className="relative h-56 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500"
              style={{ 
                background: style.background,
                transform: isSelected ? 'rotateY(0deg)' : 'rotateY(0deg)',
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Overlay avec texture */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0%, transparent 50%),
                                   radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
                }}>
                </div>
              </div>

              {/* Particules flottantes pour Attijari */}
              {style.cardClass === 'attijari' && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full opacity-40 animate-pulse"></div>
                  <div className="absolute top-20 right-20 w-1.5 h-1.5 bg-yellow-200 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-16 left-24 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
                  <div className="absolute top-32 right-12 w-2 h-2 bg-orange-200 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>
              )}

              {/* Vagues animées pour Afriquia */}
              {style.cardClass === 'afriquia' && (
                <div className="absolute inset-0 overflow-hidden opacity-20">
                  <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>
              )}

              {/* Indicateur de sélection élégant */}
              {isSelected && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg animate-fadeIn">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-gray-800">Sélectionnée</span>
                  </div>
                </div>
              )}

              {/* Contenu de la carte */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                
                {/* En-tête */}
                <div className="flex justify-between items-start">
                  {/* <div className="space-y-1">
                    {style.cardClass === 'attijari' && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          {style.labelText}
                        </span>
                      </div>
                    )}
                    {style.cardClass === 'afriquia' && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-2xl font-light text-white tracking-wider">
                          {style.labelText}
                        </span>
                      </div>
                    )}
                  </div> */}

                  {/* Logo carte selon le type */}
                  {style.cardClass === 'afriquia' && (
                    <div className="flex items-center gap-2 bg-gradient-to-br from-orange-400 to-orange-600 px-3 py-1.5 rounded-lg shadow-lg">
                      <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                        <span className="text-orange-600 font-black text-xs">A</span>
                      </div>
                      <span className="text-white text-[10px] font-black tracking-widest">AFRIQUIA</span>
                    </div>
                  )}
                </div>

                {/* Numéro de carte avec design moderne */}
                <div className="space-y-4">
                  {/* Puce NFC moderne */}
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-10 rounded-lg shadow-inner relative overflow-hidden ${
                      style.cardClass === 'afriquia' 
                        ? 'bg-gradient-to-br from-yellow-500/30 to-yellow-700/30' 
                        : 'bg-gradient-to-br from-yellow-400/40 to-amber-600/40'
                    }`}>
                      <div className="absolute inset-1 bg-gradient-to-br from-white/10 to-transparent rounded"></div>
                      <div className="absolute inset-2 grid grid-cols-4 grid-rows-3 gap-[1px]">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="bg-white/20"></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Symbole sans contact */}
                    <div className="flex gap-0.5 opacity-60">
                      {[...Array(4)].map((_, i) => (
                        <div 
                          key={i} 
                          className="w-3 h-3 border-2 border-white rounded-full"
                          style={{ marginLeft: i > 0 ? '-6px' : '0', transform: `scale(${1 - i * 0.15})` }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Numéro */}
                  <div className="font-mono text-xl tracking-[0.4em] text-white drop-shadow-lg">
                    {card.number || '•••• •••• •••• ••••'}
                  </div>
                </div>

                {/* Pied de carte */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-2xl font-semibold text-white">
                     {card.type}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Solde</p>
                    <p className="text-2xl font-bold text-white drop-shadow-lg">
                      {card.balance?.toFixed(2)} <span className="text-sm font-normal">DH</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shine"></div>
              </div>

              {/* Bordure lumineuse pour la sélection */}
              {isSelected && (
                <div className="absolute inset-0 rounded-3xl border-2 border-white/50 pointer-events-none animate-fadeIn"></div>
              )}
            </div>

            {/* Ombre portée dynamique */}
            <div 
              className={`absolute inset-0 rounded-3xl transition-all duration-500 -z-10 ${
                isSelected ? 'blur-xl opacity-40' : 'blur-md opacity-20'
              }`}
              style={{ 
                background: style.brandColor,
                transform: 'translateY(8px)'
              }}
            ></div>
          </div>
        );
      })}

      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-shine {
          animation: shine 3s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default CustomBankCards;