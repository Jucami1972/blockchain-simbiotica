'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Contrato de AchieveX para la Blockchain Simbiótica
 * Implementa funcionalidades para gestionar logros, recompensas y gamificación
 */
class AchieveXContract extends Contract {
    
    /**
     * Inicializa el contrato con los valores predeterminados
     * @param {Context} ctx - Contexto de transacción
     */
    async init(ctx) {
        console.info('============= Inicializando Contrato de AchieveX =============');
        
        // Configuración del contrato de AchieveX
        const achieveXConfig = {
            version: '1.0',
            admin: 'admin',
            rewardTypes: ['badge', 'points', 'token', 'nft'],
            achievementCategories: ['learning', 'health', 'community', 'professional'],
            tokenRewardAddress: 'token_contract_address'
        };
        
        await ctx.stub.putState('achieveXConfig', Buffer.from(JSON.stringify(achieveXConfig)));
        
        console.info('============= Contrato de AchieveX inicializado correctamente =============');
        return JSON.stringify(achieveXConfig);
    }
    
    /**
     * Crea una nueva categoría de logros
     * @param {Context} ctx - Contexto de transacción
     * @param {String} categoryId - ID único de la categoría
     * @param {String} categoryData - Datos de la categoría en formato JSON
     * @returns {Object} - Información de la categoría creada
     */
    async createCategory(ctx, categoryId, categoryData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!categoryId || !categoryData) {
            throw new Error('Parámetros inválidos: se requiere ID de categoría y datos de categoría');
        }
        
        // Verificar si la categoría ya existe
        const existingCategoryBuffer = await ctx.stub.getState(`category_${categoryId}`);
        if (existingCategoryBuffer && existingCategoryBuffer.length > 0) {
            throw new Error(`La categoría con ID ${categoryId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let categoryDataObj;
        try {
            categoryDataObj = JSON.parse(categoryData);
        } catch (error) {
            throw new Error('Los datos de la categoría deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!categoryDataObj.name || !categoryDataObj.description) {
            throw new Error('Los datos de la categoría deben incluir nombre y descripción');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede crear categorías');
        }
        
        // Crear categoría
        const now = new Date();
        const category = {
            id: categoryId,
            name: categoryDataObj.name,
            description: categoryDataObj.description,
            icon: categoryDataObj.icon || null,
            color: categoryDataObj.color || '#3498db',
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            achievements: []
        };
        
        // Guardar categoría
        await ctx.stub.putState(`category_${categoryId}`, Buffer.from(JSON.stringify(category)));
        
        // Emitir evento de categoría creada
        const categoryEvent = {
            type: 'create',
            categoryId: categoryId,
            name: category.name,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('CategoryCreated', Buffer.from(JSON.stringify(categoryEvent)));
        
        return category;
    }
    
    /**
     * Crea un nuevo logro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} achievementId - ID único del logro
     * @param {String} categoryId - ID de la categoría
     * @param {String} achievementData - Datos del logro en formato JSON
     * @returns {Object} - Información del logro creado
     */
    async createAchievement(ctx, achievementId, categoryId, achievementData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!achievementId || !categoryId || !achievementData) {
            throw new Error('Parámetros inválidos: se requiere ID de logro, ID de categoría y datos del logro');
        }
        
        // Verificar si el logro ya existe
        const existingAchievementBuffer = await ctx.stub.getState(`achievement_${achievementId}`);
        if (existingAchievementBuffer && existingAchievementBuffer.length > 0) {
            throw new Error(`El logro con ID ${achievementId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let achievementDataObj;
        try {
            achievementDataObj = JSON.parse(achievementData);
        } catch (error) {
            throw new Error('Los datos del logro deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!achievementDataObj.name || !achievementDataObj.description || !achievementDataObj.criteria) {
            throw new Error('Los datos del logro deben incluir nombre, descripción y criterios');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede crear logros');
        }
        
        // Verificar que la categoría exista
        const categoryBuffer = await ctx.stub.getState(`category_${categoryId}`);
        if (!categoryBuffer || categoryBuffer.length === 0) {
            throw new Error(`La categoría con ID ${categoryId} no existe`);
        }
        
        const category = JSON.parse(categoryBuffer.toString());
        
        // Crear logro
        const now = new Date();
        const achievement = {
            id: achievementId,
            categoryId: categoryId,
            name: achievementDataObj.name,
            description: achievementDataObj.description,
            criteria: achievementDataObj.criteria,
            icon: achievementDataObj.icon || null,
            badge: achievementDataObj.badge || null,
            points: achievementDataObj.points || 0,
            tokenReward: achievementDataObj.tokenReward || 0,
            nftReward: achievementDataObj.nftReward || null,
            difficulty: achievementDataObj.difficulty || 'medium',
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            active: true
        };
        
        // Añadir logro a la categoría
        category.achievements.push(achievementId);
        category.updatedAt = now.toISOString();
        
        // Guardar logro y categoría actualizada
        await ctx.stub.putState(`achievement_${achievementId}`, Buffer.from(JSON.stringify(achievement)));
        await ctx.stub.putState(`category_${categoryId}`, Buffer.from(JSON.stringify(category)));
        
        // Emitir evento de logro creado
        const achievementEvent = {
            type: 'create',
            achievementId: achievementId,
            categoryId: categoryId,
            name: achievement.name,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('AchievementCreated', Buffer.from(JSON.stringify(achievementEvent)));
        
        return achievement;
    }
    
    /**
     * Otorga un logro a un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @param {String} achievementId - ID del logro
     * @param {String} evidence - Evidencia del logro en formato JSON (opcional)
     * @returns {Object} - Información del logro otorgado
     */
    async awardAchievement(ctx, userId, achievementId, evidence) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!userId || !achievementId) {
            throw new Error('Parámetros inválidos: se requiere ID de usuario e ID de logro');
        }
        
        // Verificar que el logro exista
        const achievementBuffer = await ctx.stub.getState(`achievement_${achievementId}`);
        if (!achievementBuffer || achievementBuffer.length === 0) {
            throw new Error(`El logro con ID ${achievementId} no existe`);
        }
        
        const achievement = JSON.parse(achievementBuffer.toString());
        
        // Verificar que el logro esté activo
        if (!achievement.active) {
            throw new Error('El logro no está activo');
        }
        
        // Verificar si el usuario ya tiene el logro
        const userAchievementKey = `user_achievement_${userId}_${achievementId}`;
        const existingUserAchievementBuffer = await ctx.stub.getState(userAchievementKey);
        if (existingUserAchievementBuffer && existingUserAchievementBuffer.length > 0) {
            throw new Error(`El usuario ya tiene el logro con ID ${achievementId}`);
        }
        
        // Procesar evidencia si se proporciona
        let evidenceObj = {};
        if (evidence) {
            try {
                evidenceObj = JSON.parse(evidence);
            } catch (error) {
                throw new Error('La evidencia debe estar en formato JSON válido');
            }
        }
        
        // Crear registro de logro del usuario
        const now = new Date();
        const userAchievement = {
            userId: userId,
            achievementId: achievementId,
            categoryId: achievement.categoryId,
            awardedAt: now.toISOString(),
            awardedBy: caller,
            evidence: evidenceObj,
            points: achievement.points,
            tokenReward: achievement.tokenReward,
            nftReward: achievement.nftReward ? {
                id: `nft_${userId}_${achievementId}_${now.getTime()}`,
                metadata: achievement.nftReward
            } : null
        };
        
        // Guardar logro del usuario
        await ctx.stub.putState(userAchievementKey, Buffer.from(JSON.stringify(userAchievement)));
        
        // Actualizar perfil del usuario o crearlo si no existe
        const userProfileKey = `user_profile_${userId}`;
        let userProfile;
        
        const userProfileBuffer = await ctx.stub.getState(userProfileKey);
        if (!userProfileBuffer || userProfileBuffer.length === 0) {
            // Crear nuevo perfil
            userProfile = {
                userId: userId,
                totalPoints: achievement.points,
                totalTokens: achievement.tokenReward,
                achievements: [achievementId],
                badges: achievement.badge ? [achievement.badge] : [],
                nfts: userAchievement.nftReward ? [userAchievement.nftReward.id] : [],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
        } else {
            // Actualizar perfil existente
            userProfile = JSON.parse(userProfileBuffer.toString());
            userProfile.totalPoints += achievement.points;
            userProfile.totalTokens += achievement.tokenReward;
            userProfile.achievements.push(achievementId);
            if (achievement.badge) {
                userProfile.badges.push(achievement.badge);
            }
            if (userAchievement.nftReward) {
                userProfile.nfts.push(userAchievement.nftReward.id);
            }
            userProfile.updatedAt = now.toISOString();
        }
        
        // Guardar perfil del usuario
        await ctx.stub.putState(userProfileKey, Buffer.from(JSON.stringify(userProfile)));
        
        // Emitir evento de logro otorgado
        const awardEvent = {
            type: 'award',
            userId: userId,
            achievementId: achievementId,
            categoryId: achievement.categoryId,
            points: achievement.points,
            tokenReward: achievement.tokenReward,
            hasNFT: !!userAchievement.nftReward,
            awardedBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('AchievementAwarded', Buffer.from(JSON.stringify(awardEvent)));
        
        return userAchievement;
    }
    
    /**
     * Actualiza un logro existente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} achievementId - ID del logro
     * @param {String} achievementData - Nuevos datos del logro en formato JSON
     * @returns {Object} - Información del logro actualizado
     */
    async updateAchievement(ctx, achievementId, achievementData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!achievementId || !achievementData) {
            throw new Error('Parámetros inválidos: se requiere ID de logro y datos del logro');
        }
        
        // Verificar que los datos sean JSON válido
        let achievementDataObj;
        try {
            achievementDataObj = JSON.parse(achievementData);
        } catch (error) {
            throw new Error('Los datos del logro deben estar en formato JSON válido');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar logros');
        }
        
        // Verificar que el logro exista
        const achievementBuffer = await ctx.stub.getState(`achievement_${achievementId}`);
        if (!achievementBuffer || achievementBuffer.length === 0) {
            throw new Error(`El logro con ID ${achievementId} no existe`);
        }
        
        const achievement = JSON.parse(achievementBuffer.toString());
        
        // Actualizar campos del logro
        const updatedAchievement = {
            ...achievement,
            name: achievementDataObj.name || achievement.name,
            description: achievementDataObj.description || achievement.description,
            criteria: achievementDataObj.criteria || achievement.criteria,
            icon: achievementDataObj.icon !== undefined ? achievementDataObj.icon : achievement.icon,
            badge: achievementDataObj.badge !== undefined ? achievementDataObj.badge : achievement.badge,
            points: achievementDataObj.points !== undefined ? achievementDataObj.points : achievement.points,
            tokenReward: achievementDataObj.tokenReward !== undefined ? achievementDataObj.tokenReward : achievement.tokenReward,
            nftReward: achievementDataObj.nftReward !== undefined ? achievementDataObj.nftReward : achievement.nftReward,
            difficulty: achievementDataObj.difficulty || achievement.difficulty,
            active: achievementDataObj.active !== undefined ? achievementDataObj.active : achievement.active,
            updatedAt: new Date().toISOString()
        };
        
        // Guardar logro actualizado
        await ctx.stub.putState(`achievement_${achievementId}`, Buffer.from(JSON.stringify(updatedAchievement)));
        
        // Emitir evento de logro actualizado
        const updateEvent = {
            type: 'update',
            achievementId: achievementId,
            name: updatedAchievement.name,
            updatedBy: caller,
            timestamp: updatedAchievement.updatedAt
        };
        await ctx.stub.setEvent('AchievementUpdated', Buffer.from(JSON.stringify(updateEvent)));
        
        return updatedAchievement;
    }
    
    /**
     * Actualiza una categoría existente
     * @param {Context} ctx - Contexto de transacción
     * @param {String} categoryId - ID de la categoría
     * @param {String} categoryData - Nuevos datos de la categoría en formato JSON
     * @returns {Object} - Información de la categoría actualizada
     */
    async updateCategory(ctx, categoryId, categoryData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!categoryId || !categoryData) {
            throw new Error('Parámetros inválidos: se requiere ID de categoría y datos de categoría');
        }
        
        // Verificar que los datos sean JSON válido
        let categoryDataObj;
        try {
            categoryDataObj = JSON.parse(categoryData);
        } catch (error) {
            throw new Error('Los datos de la categoría deben estar en formato JSON válido');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar categorías');
        }
        
        // Verificar que la categoría exista
        const categoryBuffer = await ctx.stub.getState(`category_${categoryId}`);
        if (!categoryBuffer || categoryBuffer.length === 0) {
            throw new Error(`La categoría con ID ${categoryId} no existe`);
        }
        
        const category = JSON.parse(categoryBuffer.toString());
        
        // Actualizar campos de la categoría
        const updatedCategory = {
            ...category,
            name: categoryDataObj.name || category.name,
            description: categoryDataObj.description || category.description,
            icon: categoryDataObj.icon !== undefined ? categoryDataObj.icon : category.icon,
            color: categoryDataObj.color || category.color,
            updatedAt: new Date().toISOString()
        };
        
        // Guardar categoría actualizada
        await ctx.stub.putState(`category_${categoryId}`, Buffer.from(JSON.stringify(updatedCategory)));
        
        // Emitir evento de categoría actualizada
        const updateEvent = {
            type: 'update',
            categoryId: categoryId,
            name: updatedCategory.name,
            updatedBy: caller,
            timestamp: updatedCategory.updatedAt
        };
        await ctx.stub.setEvent('CategoryUpdated', Buffer.from(JSON.stringify(updateEvent)));
        
        return updatedCategory;
    }
    
    /**
     * Obtiene un logro
     * @param {Context} ctx - Contexto de transacción
     * @param {String} achievementId - ID del logro
     * @returns {Object} - Información del logro
     */
    async getAchievement(ctx, achievementId) {
        // Validar parámetros
        if (!achievementId) {
            throw new Error('Parámetros inválidos: se requiere ID del logro');
        }
        
        // Obtener logro
        const achievementBuffer = await ctx.stub.getState(`achievement_${achievementId}`);
        if (!achievementBuffer || achievementBuffer.length === 0) {
            throw new Error(`Logro con ID ${achievementId} no encontrado`);
        }
        
        return JSON.parse(achievementBuffer.toString());
    }
    
    /**
     * Obtiene una categoría
     * @param {Context} ctx - Contexto de transacción
     * @param {String} categoryId - ID de la categoría
     * @returns {Object} - Información de la categoría
     */
    async getCategory(ctx, categoryId) {
        // Validar parámetros
        if (!categoryId) {
            throw new Error('Parámetros inválidos: se requiere ID de la categoría');
        }
        
        // Obtener categoría
        const categoryBuffer = await ctx.stub.getState(`category_${categoryId}`);
        if (!categoryBuffer || categoryBuffer.length === 0) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada`);
        }
        
        return JSON.parse(categoryBuffer.toString());
    }
    
    /**
     * Obtiene el perfil de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Object} - Perfil del usuario
     */
    async getUserProfile(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario');
        }
        
        // Obtener perfil del usuario
        const userProfileBuffer = await ctx.stub.getState(`user_profile_${userId}`);
        if (!userProfileBuffer || userProfileBuffer.length === 0) {
            throw new Error(`Perfil de usuario con ID ${userId} no encontrado`);
        }
        
        return JSON.parse(userProfileBuffer.toString());
    }
    
    /**
     * Obtiene todos los logros de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Lista de logros del usuario
     */
    async getUserAchievements(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario');
        }
        
        // Consultar logros del usuario
        const query = {
            selector: {
                userId: userId
            },
            use_index: ['_design/indexUserIdDoc', 'indexUserId']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const userAchievements = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const userAchievement = JSON.parse(result.value.value.toString());
            userAchievements.push(userAchievement);
            result = await iterator.next();
        }
        
        return userAchievements;
    }
    
    /**
     * Obtiene todos los logros de una categoría
     * @param {Context} ctx - Contexto de transacción
     * @param {String} categoryId - ID de la categoría
     * @returns {Array} - Lista de logros de la categoría
     */
    async getCategoryAchievements(ctx, categoryId) {
        // Validar parámetros
        if (!categoryId) {
            throw new Error('Parámetros inválidos: se requiere ID de la categoría');
        }
        
        // Obtener categoría
        const categoryBuffer = await ctx.stub.getState(`category_${categoryId}`);
        if (!categoryBuffer || categoryBuffer.length === 0) {
            throw new Error(`Categoría con ID ${categoryId} no encontrada`);
        }
        
        const category = JSON.parse(categoryBuffer.toString());
        
        // Obtener logros de la categoría
        const achievements = [];
        for (const achievementId of category.achievements) {
            const achievementBuffer = await ctx.stub.getState(`achievement_${achievementId}`);
            if (achievementBuffer && achievementBuffer.length > 0) {
                achievements.push(JSON.parse(achievementBuffer.toString()));
            }
        }
        
        return achievements;
    }
    
    /**
     * Obtiene todas las categorías
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de categorías
     */
    async getAllCategories(ctx) {
        // Consultar todas las categorías
        const query = {
            selector: {
                docType: 'category'
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const categories = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const category = JSON.parse(result.value.value.toString());
            categories.push(category);
            result = await iterator.next();
        }
        
        return categories;
    }
    
    /**
     * Crea un nuevo reto
     * @param {Context} ctx - Contexto de transacción
     * @param {String} challengeId - ID único del reto
     * @param {String} challengeData - Datos del reto en formato JSON
     * @returns {Object} - Información del reto creado
     */
    async createChallenge(ctx, challengeId, challengeData) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!challengeId || !challengeData) {
            throw new Error('Parámetros inválidos: se requiere ID del reto y datos del reto');
        }
        
        // Verificar si el reto ya existe
        const existingChallengeBuffer = await ctx.stub.getState(`challenge_${challengeId}`);
        if (existingChallengeBuffer && existingChallengeBuffer.length > 0) {
            throw new Error(`El reto con ID ${challengeId} ya existe`);
        }
        
        // Verificar que los datos sean JSON válido
        let challengeDataObj;
        try {
            challengeDataObj = JSON.parse(challengeData);
        } catch (error) {
            throw new Error('Los datos del reto deben estar en formato JSON válido');
        }
        
        // Verificar campos requeridos
        if (!challengeDataObj.name || !challengeDataObj.description || !challengeDataObj.startDate || !challengeDataObj.endDate) {
            throw new Error('Los datos del reto deben incluir nombre, descripción, fecha de inicio y fecha de fin');
        }
        
        // Verificar fechas
        const startDate = new Date(challengeDataObj.startDate);
        const endDate = new Date(challengeDataObj.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Formato de fecha inválido. Use formato ISO 8601');
        }
        
        if (endDate <= startDate) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede crear retos');
        }
        
        // Crear reto
        const now = new Date();
        const challenge = {
            id: challengeId,
            name: challengeDataObj.name,
            description: challengeDataObj.description,
            startDate: challengeDataObj.startDate,
            endDate: challengeDataObj.endDate,
            achievements: challengeDataObj.achievements || [],
            criteria: challengeDataObj.criteria || {},
            rewards: challengeDataObj.rewards || {
                points: 0,
                tokens: 0,
                badge: null,
                nft: null
            },
            participants: [],
            completions: [],
            createdAt: now.toISOString(),
            createdBy: caller,
            updatedAt: now.toISOString(),
            status: now > startDate ? (now > endDate ? 'completed' : 'active') : 'upcoming'
        };
        
        // Guardar reto
        await ctx.stub.putState(`challenge_${challengeId}`, Buffer.from(JSON.stringify(challenge)));
        
        // Emitir evento de reto creado
        const challengeEvent = {
            type: 'create',
            challengeId: challengeId,
            name: challenge.name,
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            createdBy: caller,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ChallengeCreated', Buffer.from(JSON.stringify(challengeEvent)));
        
        return challenge;
    }
    
    /**
     * Registra un usuario en un reto
     * @param {Context} ctx - Contexto de transacción
     * @param {String} challengeId - ID del reto
     * @param {String} userId - ID del usuario
     * @returns {Object} - Información del reto actualizado
     */
    async joinChallenge(ctx, challengeId, userId) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!challengeId || !userId) {
            throw new Error('Parámetros inválidos: se requiere ID del reto e ID del usuario');
        }
        
        // Verificar que el reto exista
        const challengeBuffer = await ctx.stub.getState(`challenge_${challengeId}`);
        if (!challengeBuffer || challengeBuffer.length === 0) {
            throw new Error(`El reto con ID ${challengeId} no existe`);
        }
        
        const challenge = JSON.parse(challengeBuffer.toString());
        
        // Verificar que el reto esté activo o próximo
        if (challenge.status === 'completed') {
            throw new Error('El reto ya ha finalizado');
        }
        
        // Verificar que el usuario no esté ya registrado
        if (challenge.participants.includes(userId)) {
            throw new Error(`El usuario ya está registrado en el reto con ID ${challengeId}`);
        }
        
        // Registrar usuario en el reto
        challenge.participants.push(userId);
        challenge.updatedAt = new Date().toISOString();
        
        // Guardar reto actualizado
        await ctx.stub.putState(`challenge_${challengeId}`, Buffer.from(JSON.stringify(challenge)));
        
        // Emitir evento de usuario registrado en reto
        const joinEvent = {
            type: 'join',
            challengeId: challengeId,
            userId: userId,
            registeredBy: caller,
            timestamp: challenge.updatedAt
        };
        await ctx.stub.setEvent('ChallengeJoined', Buffer.from(JSON.stringify(joinEvent)));
        
        return challenge;
    }
    
    /**
     * Completa un reto para un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} challengeId - ID del reto
     * @param {String} userId - ID del usuario
     * @param {String} evidence - Evidencia de la compleción en formato JSON (opcional)
     * @returns {Object} - Información del reto actualizado
     */
    async completeChallenge(ctx, challengeId, userId, evidence) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!challengeId || !userId) {
            throw new Error('Parámetros inválidos: se requiere ID del reto e ID del usuario');
        }
        
        // Verificar que el reto exista
        const challengeBuffer = await ctx.stub.getState(`challenge_${challengeId}`);
        if (!challengeBuffer || challengeBuffer.length === 0) {
            throw new Error(`El reto con ID ${challengeId} no existe`);
        }
        
        const challenge = JSON.parse(challengeBuffer.toString());
        
        // Verificar que el reto esté activo
        if (challenge.status !== 'active') {
            throw new Error('Solo se pueden completar retos activos');
        }
        
        // Verificar que el usuario esté registrado en el reto
        if (!challenge.participants.includes(userId)) {
            throw new Error(`El usuario no está registrado en el reto con ID ${challengeId}`);
        }
        
        // Verificar que el usuario no haya completado ya el reto
        const existingCompletion = challenge.completions.find(completion => completion.userId === userId);
        if (existingCompletion) {
            throw new Error(`El usuario ya ha completado el reto con ID ${challengeId}`);
        }
        
        // Procesar evidencia si se proporciona
        let evidenceObj = {};
        if (evidence) {
            try {
                evidenceObj = JSON.parse(evidence);
            } catch (error) {
                throw new Error('La evidencia debe estar en formato JSON válido');
            }
        }
        
        // Registrar compleción del reto
        const now = new Date();
        const completion = {
            userId: userId,
            completedAt: now.toISOString(),
            completedBy: caller,
            evidence: evidenceObj
        };
        
        challenge.completions.push(completion);
        challenge.updatedAt = now.toISOString();
        
        // Guardar reto actualizado
        await ctx.stub.putState(`challenge_${challengeId}`, Buffer.from(JSON.stringify(challenge)));
        
        // Actualizar perfil del usuario
        const userProfileKey = `user_profile_${userId}`;
        let userProfile;
        
        const userProfileBuffer = await ctx.stub.getState(userProfileKey);
        if (!userProfileBuffer || userProfileBuffer.length === 0) {
            // Crear nuevo perfil
            userProfile = {
                userId: userId,
                totalPoints: challenge.rewards.points || 0,
                totalTokens: challenge.rewards.tokens || 0,
                achievements: [],
                badges: challenge.rewards.badge ? [challenge.rewards.badge] : [],
                nfts: challenge.rewards.nft ? [`nft_challenge_${challengeId}_${userId}`] : [],
                challenges: [challengeId],
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
        } else {
            // Actualizar perfil existente
            userProfile = JSON.parse(userProfileBuffer.toString());
            userProfile.totalPoints += (challenge.rewards.points || 0);
            userProfile.totalTokens += (challenge.rewards.tokens || 0);
            if (challenge.rewards.badge) {
                userProfile.badges.push(challenge.rewards.badge);
            }
            if (challenge.rewards.nft) {
                userProfile.nfts.push(`nft_challenge_${challengeId}_${userId}`);
            }
            if (!userProfile.challenges) {
                userProfile.challenges = [challengeId];
            } else {
                userProfile.challenges.push(challengeId);
            }
            userProfile.updatedAt = now.toISOString();
        }
        
        // Guardar perfil del usuario
        await ctx.stub.putState(userProfileKey, Buffer.from(JSON.stringify(userProfile)));
        
        // Emitir evento de reto completado
        const completeEvent = {
            type: 'complete',
            challengeId: challengeId,
            userId: userId,
            completedBy: caller,
            points: challenge.rewards.points || 0,
            tokens: challenge.rewards.tokens || 0,
            hasBadge: !!challenge.rewards.badge,
            hasNFT: !!challenge.rewards.nft,
            timestamp: now.toISOString()
        };
        await ctx.stub.setEvent('ChallengeCompleted', Buffer.from(JSON.stringify(completeEvent)));
        
        return challenge;
    }
    
    /**
     * Actualiza el estado de un reto
     * @param {Context} ctx - Contexto de transacción
     * @param {String} challengeId - ID del reto
     * @param {String} status - Nuevo estado (upcoming, active, completed)
     * @returns {Object} - Información del reto actualizado
     */
    async updateChallengeStatus(ctx, challengeId, status) {
        // Obtener la identidad del llamante
        const clientIdentity = ctx.clientIdentity;
        const caller = clientIdentity.getID();
        
        // Validar parámetros
        if (!challengeId || !status) {
            throw new Error('Parámetros inválidos: se requiere ID del reto y estado');
        }
        
        // Verificar estado válido
        const validStatus = ['upcoming', 'active', 'completed'];
        if (!validStatus.includes(status)) {
            throw new Error(`Estado inválido. Debe ser uno de: ${validStatus.join(', ')}`);
        }
        
        // Verificar que el reto exista
        const challengeBuffer = await ctx.stub.getState(`challenge_${challengeId}`);
        if (!challengeBuffer || challengeBuffer.length === 0) {
            throw new Error(`El reto con ID ${challengeId} no existe`);
        }
        
        const challenge = JSON.parse(challengeBuffer.toString());
        
        // Obtener configuración
        const configBuffer = await ctx.stub.getState('achieveXConfig');
        const config = JSON.parse(configBuffer.toString());
        
        // Verificar que el llamante sea el administrador
        if (caller !== config.admin) {
            throw new Error('Solo el administrador puede actualizar el estado de los retos');
        }
        
        // Actualizar estado del reto
        challenge.status = status;
        challenge.updatedAt = new Date().toISOString();
        
        // Guardar reto actualizado
        await ctx.stub.putState(`challenge_${challengeId}`, Buffer.from(JSON.stringify(challenge)));
        
        // Emitir evento de estado de reto actualizado
        const statusEvent = {
            type: 'updateStatus',
            challengeId: challengeId,
            status: status,
            updatedBy: caller,
            timestamp: challenge.updatedAt
        };
        await ctx.stub.setEvent('ChallengeStatusUpdated', Buffer.from(JSON.stringify(statusEvent)));
        
        return challenge;
    }
    
    /**
     * Obtiene un reto
     * @param {Context} ctx - Contexto de transacción
     * @param {String} challengeId - ID del reto
     * @returns {Object} - Información del reto
     */
    async getChallenge(ctx, challengeId) {
        // Validar parámetros
        if (!challengeId) {
            throw new Error('Parámetros inválidos: se requiere ID del reto');
        }
        
        // Obtener reto
        const challengeBuffer = await ctx.stub.getState(`challenge_${challengeId}`);
        if (!challengeBuffer || challengeBuffer.length === 0) {
            throw new Error(`Reto con ID ${challengeId} no encontrado`);
        }
        
        return JSON.parse(challengeBuffer.toString());
    }
    
    /**
     * Obtiene todos los retos activos
     * @param {Context} ctx - Contexto de transacción
     * @returns {Array} - Lista de retos activos
     */
    async getActiveChallenges(ctx) {
        // Consultar retos activos
        const query = {
            selector: {
                status: 'active'
            },
            use_index: ['_design/indexStatusDoc', 'indexStatus']
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const challenges = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const challenge = JSON.parse(result.value.value.toString());
            challenges.push(challenge);
            result = await iterator.next();
        }
        
        return challenges;
    }
    
    /**
     * Obtiene todos los retos de un usuario
     * @param {Context} ctx - Contexto de transacción
     * @param {String} userId - ID del usuario
     * @returns {Array} - Lista de retos del usuario
     */
    async getUserChallenges(ctx, userId) {
        // Validar parámetros
        if (!userId) {
            throw new Error('Parámetros inválidos: se requiere ID del usuario');
        }
        
        // Consultar todos los retos
        const query = {
            selector: {
                participants: {
                    $elemMatch: {
                        $eq: userId
                    }
                }
            }
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const challenges = [];
        
        let result = await iterator.next();
        while (!result.done) {
            const challenge = JSON.parse(result.value.value.toString());
            challenges.push(challenge);
            result = await iterator.next();
        }
        
        return challenges;
    }
}

module.exports = AchieveXContract;
