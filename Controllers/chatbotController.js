// Controllers/chatbotController.js
// Version qui utilise VOS données réelles - Sans API externe

const formationModel = require('../Model/formationModel');
const centreModel = require('../Model/centreModel');
const userModel = require('../Model/userModel');

// ═══════════════════════════════════════════════════════
// 1. Récupérer les données réelles de la DB
// ═══════════════════════════════════════════════════════
async function getRealData() {
    try {
        // Récupérer les formations acceptées
        const formations = await formationModel
            .find({ status: 'accepted' })
            .select('name domain centre location price level skills description')
            .limit(30);

        // Récupérer les centres
        const centres = await centreModel
            .find({ status: 'accepted' })
            .select('name email phone address city');

        return { formations, centres };
    } catch (error) {
        console.error("Erreur récupération données:", error);
        return { formations: [], centres: [] };
    }
}

// ═══════════════════════════════════════════════════════
// 2. Fonction pour chercher des formations par mot-clé
// ═══════════════════════════════════════════════════════
function searchFormationsByKeyword(formations, keyword) {
    const keywordLower = keyword.toLowerCase();
    
    return formations.filter(f => {
        return (
            f.name?.toLowerCase().includes(keywordLower) ||
            f.domain?.toLowerCase().includes(keywordLower) ||
            f.skills?.some(s => s.toLowerCase().includes(keywordLower)) ||
            f.description?.toLowerCase().includes(keywordLower)
        );
    });
}

// ═══════════════════════════════════════════════════════
// 3. Fonction principale - Répond avec VOS données
// ═══════════════════════════════════════════════════════
module.exports.sendMessage = async (req, res) => {
    try {
        console.log("📩 Message reçu:", req.body?.message);
        
        const { message, history = [] } = req.body;
        const userId = req.user?.id || null;
        const messageLower = message.toLowerCase();

        if (!message?.trim()) {
            return res.status(400).json({ error: 'Message vide' });
        }

        // Récupérer les VRAIES données de votre DB
        const { formations, centres } = await getRealData();
        
        let reply = "";

        // ═══════════════════════════════════════════════
        // RECHERCHE PAR DOMAINE
        // ═══════════════════════════════════════════════
        if (messageLower.includes("développement web") || 
            messageLower.includes("web") || 
            messageLower.includes("html") ||
            messageLower.includes("javascript") ||
            messageLower.includes("react")) {
            
            const webFormations = searchFormationsByKeyword(formations, "web");
            const devFormations = searchFormationsByKeyword(formations, "développement");
            const allWebFormations = [...new Map([...webFormations, ...devFormations].map(f => [f._id, f])).values()];
            
            if (allWebFormations.length > 0) {
                reply = `🌐 **Voici nos formations en Développement Web:**\n\n`;
                allWebFormations.slice(0, 5).forEach(f => {
                    reply += `• **${f.name}**\n`;
                    if (f.centre) reply += `  📍 ${f.centre}\n`;
                    if (f.price !== undefined) reply += `  💰 ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}\n`;
                    if (f.level) reply += `  📊 Niveau: ${f.level}\n`;
                    reply += `\n`;
                });
                reply += `Pour plus de détails, visitez notre page Formations! 🎯`;
            } else {
                reply = `🌐 Nous avons des formations en Développement Web (Full-Stack, React, Node.js, PHP).\n\nConsultez notre catalogue pour voir toutes les disponibilités!`;
            }
        }

        // ═══════════════════════════════════════════════
        // RECHERCHE PAR DOMAINE - DATA SCIENCE / IA
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("data science") || 
                 messageLower.includes("ia") || 
                 messageLower.includes("intelligence artificielle") ||
                 messageLower.includes("machine learning") ||
                 messageLower.includes("python")) {
            
            const dataFormations = searchFormationsByKeyword(formations, "data");
            const iaFormations = searchFormationsByKeyword(formations, "ia");
            const pythonFormations = searchFormationsByKeyword(formations, "python");
            const allDataFormations = [...new Map([...dataFormations, ...iaFormations, ...pythonFormations].map(f => [f._id, f])).values()];
            
            if (allDataFormations.length > 0) {
                reply = `🤖 **Nos formations en Data Science & IA:**\n\n`;
                allDataFormations.slice(0, 5).forEach(f => {
                    reply += `• **${f.name}**\n`;
                    if (f.centre) reply += `  📍 ${f.centre}\n`;
                    if (f.price !== undefined) reply += `  💰 ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}\n`;
                    reply += `\n`;
                });
            } else {
                reply = `🤖 Nous proposons des formations en Data Science, Python, Machine Learning et IA.\n\nInscrivez-vous pour recevoir nos recommandations personnalisées!`;
            }
        }

        // ═══════════════════════════════════════════════
        // RECHERCHE PAR DOMAINE - CYBERSÉCURITÉ
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("cybersécurité") || 
                 messageLower.includes("cybersecurite") ||
                 messageLower.includes("sécurité") ||
                 messageLower.includes("securite") ||
                 messageLower.includes("hacking")) {
            
            const cyberFormations = searchFormationsByKeyword(formations, "cyber");
            const secFormations = searchFormationsByKeyword(formations, "sécurité");
            const allCyberFormations = [...new Map([...cyberFormations, ...secFormations].map(f => [f._id, f])).values()];
            
            if (allCyberFormations.length > 0) {
                reply = `🔒 **Nos formations en Cybersécurité:**\n\n`;
                allCyberFormations.slice(0, 5).forEach(f => {
                    reply += `• **${f.name}**\n`;
                    if (f.price !== undefined) reply += `  💰 ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}\n`;
                    reply += `\n`;
                });
            } else {
                reply = `🔒 Nous avons des formations en Cybersécurité, Sécurité des réseaux et Ethical Hacking.\n\nContactez-nous pour plus d'informations!`;
            }
        }

        // ═══════════════════════════════════════════════
        // LISTE TOUTES LES FORMATIONS
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("toutes les formations") || 
                 messageLower.includes("liste des formations") ||
                 (messageLower.includes("formation") && (messageLower.includes("liste") || messageLower.includes("toutes")))) {
            
            if (formations.length > 0) {
                reply = `📚 **Nos formations disponibles (${formations.length} résultats):**\n\n`;
                formations.slice(0, 10).forEach(f => {
                    reply += `• **${f.name}** - ${f.domain || 'Non spécifié'}\n`;
                    if (f.price !== undefined) reply += `  💰 ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}\n`;
                });
                if (formations.length > 10) {
                    reply += `\nEt ${formations.length - 10} autres formations...\n`;
                }
                reply += `\n🎯 Visitez notre page Formations pour voir la liste complète!`;
            } else {
                reply = `📚 Aucune formation disponible actuellement. Revenez bientôt!`;
            }
        }

        // ═══════════════════════════════════════════════
        // FORMATIONS GRATUITES
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("gratuit") || messageLower.includes("gratuite")) {
            const freeFormations = formations.filter(f => f.price === 0);
            
            if (freeFormations.length > 0) {
                reply = `🎁 **Formations GRATUITES (${freeFormations.length} disponibles):**\n\n`;
                freeFormations.slice(0, 5).forEach(f => {
                    reply += `• **${f.name}**\n`;
                    if (f.domain) reply += `  📚 ${f.domain}\n`;
                    reply += `  💰 Gratuit!\n\n`;
                });
                reply += `💰 Toutes ces formations sont 100% gratuites! Inscrivez-vous vite!`;
            } else {
                reply = `🎁 Pas de formation gratuite pour le moment, mais nous avons des formations à petits prix (moins de 100 DT). Utilisez notre filtre budget!`;
            }
        }

        // ═══════════════════════════════════════════════
        // CENTRES DE FORMATION
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("centre") || 
                 messageLower.includes("centres") || 
                 messageLower.includes("lieu") || 
                 messageLower.includes("localisation") ||
                 messageLower.includes("où")) {
            
            if (centres.length > 0) {
                reply = `📍 **Nos centres de formation:**\n\n`;
                centres.slice(0, 10).forEach(c => {
                    reply += `• **${c.name}**\n`;
                    if (c.city) reply += `  🏙️ ${c.city}\n`;
                    if (c.email) reply += `  📧 ${c.email}\n`;
                    reply += `\n`;
                });
                reply += `📍 Nous avons aussi des formations 100% en ligne disponibles partout en Tunisie!`;
            } else {
                reply = `📍 Nos centres sont situés dans plusieurs villes: Tunis, Sfax, Sousse, Nabeul, Bizerte...\n\nNous proposons aussi des formations en ligne!`;
            }
        }

        // ═══════════════════════════════════════════════
        // DOMAINES DISPONIBLES
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("domaine") || messageLower.includes("domaines")) {
            const domaines = [...new Set(formations.map(f => f.domain).filter(Boolean))];
            
            if (domaines.length > 0) {
                reply = `📚 **Nos domaines de formation:**\n\n`;
                domaines.forEach(d => {
                    const count = formations.filter(f => f.domain === d).length;
                    reply += `• **${d}** (${count} formation${count > 1 ? 's' : ''})\n`;
                });
                reply += `\n🎯 Quel domaine vous intéresse?`;
            } else {
                reply = `📚 Nos domaines: Développement Web, Data Science, IA, Cybersécurité, Design, Marketing Digital, Cloud, Mobile...`;
            }
        }

        // ═══════════════════════════════════════════════
        // INSCRIPTION
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("inscription") || messageLower.includes("inscrire")) {
            if (userId) {
                reply = `✅ **Vous êtes déjà connecté(e)!**\n\nPour vous inscrire à une formation:\n\n1️⃣ Parcourez notre catalogue de formations\n2️⃣ Cliquez sur "S'inscrire" sur la formation choisie\n3️⃣ Votre inscription sera envoyée au centre\n\n📊 Vous pouvez suivre vos inscriptions dans votre tableau de bord "Mes inscriptions".`;
            } else {
                reply = `📝 **Pour vous inscrire:**\n\n1️⃣ Créez un compte gratuitement\n2️⃣ Complétez vos préférences (domaine, niveau, budget)\n3️⃣ Recevez des recommandations personnalisées\n4️⃣ Inscrivez-vous aux formations qui vous intéressent\n\n🔗 Cliquez sur "Se connecter" en haut de la page pour commencer!`;
            }
        }

        // ═══════════════════════════════════════════════
        // RECOMMANDATIONS PERSONNALISÉES
        // ═══════════════════════════════════════════════
        else if (messageLower.includes("recommandation") || 
                 messageLower.includes("recommande") ||
                 messageLower.includes("conseille") ||
                 messageLower.includes("suggère")) {
            
            if (userId) {
                const user = await userModel.findById(userId).select('preferences');
                const userPrefs = user?.preferences || {};
                
                let recommendedFormations = [...formations];
                
                // Filtrer par domaine si l'utilisateur a une préférence
                if (userPrefs.domaine) {
                    recommendedFormations = recommendedFormations.filter(f => 
                        f.domain?.toLowerCase().includes(userPrefs.domaine.toLowerCase())
                    );
                }
                
                // Filtrer par budget
                if (userPrefs.budget === "Gratuit") {
                    recommendedFormations = recommendedFormations.filter(f => f.price === 0);
                } else if (userPrefs.budget === "Moins de 50€") {
                    recommendedFormations = recommendedFormations.filter(f => f.price < 50);
                } else if (userPrefs.budget === "50-100€") {
                    recommendedFormations = recommendedFormations.filter(f => f.price >= 50 && f.price <= 100);
                }
                
                if (recommendedFormations.length > 0) {
                    reply = `🎯 **Recommandations basées sur votre profil:**\n\n`;
                    recommendedFormations.slice(0, 5).forEach(f => {
                        reply += `• **${f.name}**\n`;
                        if (f.domain) reply += `  📚 ${f.domain}\n`;
                        if (f.price !== undefined) reply += `  💰 ${f.price === 0 ? 'Gratuit' : f.price + ' DT'}\n`;
                        reply += `\n`;
                    });
                } else {
                    reply = `🎯 Aucune formation ne correspond exactement à vos critères. Essayez de modifier vos préférences ou consultez notre catalogue complet!`;
                }
            } else {
                reply = `🎯 Pour recevoir des recommandations personnalisées:\n\n1️⃣ Créez un compte gratuit\n2️⃣ Remplissez vos préférences (domaine, niveau, budget)\n3️⃣ Notre système vous suggérera les formations idéales!\n\n🔗 Inscrivez-vous maintenant!`;
            }
        }

        // ═══════════════════════════════════════════════
        // AIDE / MENU PRINCIPAL
        // ═══════════════════════════════════════════════
        else {
            const stats = {
                totalFormations: formations.length,
                totalCentres: centres.length,
                freeFormations: formations.filter(f => f.price === 0).length,
                domaines: [...new Set(formations.map(f => f.domain).filter(Boolean))]
            };
            
            reply = `🤖 **Assistant Formini** - Je réponds avec nos données réelles!\n\n`;
            reply += `📊 **Statistiques actuelles:**\n`;
            reply += `• ${stats.totalFormations} formations disponibles\n`;
            reply += `• ${stats.totalCentres} centres partenaires\n`;
            reply += `• ${stats.freeFormations} formations gratuites\n`;
            reply += `• ${stats.domaines.length} domaines différents\n\n`;
            reply += `✨ **Ce que je peux faire:**\n`;
            reply += `• 🔍 Chercher des formations par domaine\n`;
            reply += `• 📍 Trouver des centres près de chez vous\n`;
            reply += `• 🎁 Lister les formations gratuites\n`;
            reply += `• 🎯 Recommandations personnalisées (si connecté)\n`;
            reply += `• 📝 Aide pour l'inscription\n\n`;
            reply += `💬 **Exemples de questions:**\n`;
            reply += `• "Formations en Développement web?"\n`;
            reply += `• "Y a-t-il des formations gratuites?"\n`;
            reply += `• "Où sont vos centres?"\n`;
            reply += `• "Quels domaines proposez-vous?"\n\n`;
            reply += `📢 N'hésitez pas à me poser des questions spécifiques!`;
        }

        console.log("✅ Réponse générée avec succès");
        res.status(200).json({ reply });

    } catch (err) {
        console.error('[CHATBOT] Erreur:', err.message);
        res.status(500).json({ 
            reply: "🤖 Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants ou contacter notre support." 
        });
    }
};