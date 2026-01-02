
const HackMateData = {    
    storageKey: 'hackmate_ideas',
       
    initialIdeas: [
        {
            id: 1,
            title: 'AI-Powered Study Buddy',
            description: 'An intelligent study companion that uses AI to create personalized learning paths, quiz questions, and study schedules based on your learning style.',
            skills: ['Frontend', 'AI'],
            teamSize: '4',
            contact: 'study.buddy@email.com',
            interested: 8
        },
        {
            id: 2,
            title: 'EcoTrack - Carbon Footprint Tracker',
            description: 'Mobile app to track daily carbon footprint through activities like transport, food, and energy usage. Gamified with challenges and rewards.',
            skills: ['Frontend', 'Backend'],
            teamSize: '3',
            contact: '@ecotrack_dev',
            interested: 12
        },
        {
            id: 3,
            title: 'SmartHome Security System',
            description: 'IoT-based home security with facial recognition, motion detection, and real-time alerts. Integrates with existing smart home devices.',
            skills: ['Hardware', 'AI', 'Backend'],
            teamSize: '5',
            contact: 'smarthome.sec@email.com',
            interested: 6
        },
        {
            id: 4,
            title: 'HealthSync - Medical Record Portal',
            description: 'Blockchain-based medical record system for secure sharing between patients, doctors, and hospitals. Emergency access features included.',
            skills: ['Backend', 'Frontend'],
            teamSize: '4',
            contact: '@healthsync',
            interested: 15
        }
    ],
    
    
    getAllIdeas: function() {
        const storedIdeas = localStorage.getItem(this.storageKey);
        if (storedIdeas) {
            return JSON.parse(storedIdeas);
        } else {
            
            this.saveAllIdeas(this.initialIdeas);
            return this.initialIdeas;
        }
    },
    
    
    saveAllIdeas: function(ideas) {
        localStorage.setItem(this.storageKey, JSON.stringify(ideas));
    },
    
   
    addIdea: function(ideaData) {
        const ideas = this.getAllIdeas();
        const newIdea = {
            id: Date.now(),
            title: ideaData.title,
            description: ideaData.description,
            skills: ideaData.skills,
            teamSize: ideaData.teamSize,
            contact: ideaData.contact,
            interested: 0
        };
        ideas.push(newIdea);
        this.saveAllIdeas(ideas);
        return newIdea;
    },
    
    
    filterBySkill: function(skill) {
        const allIdeas = this.getAllIdeas();
        if (skill === 'all') {
            return allIdeas;
        }
        return allIdeas.filter(idea => idea.skills.includes(skill));
    },
    
    
    incrementInterested: function(ideaId) {
        const ideas = this.getAllIdeas();
        const idea = ideas.find(i => i.id === ideaId);
        if (idea) {
            idea.interested++;
            this.saveAllIdeas(ideas);
            return idea.interested;
        }
        return 0;
    },
    
    
    getIdeaById: function(ideaId) {
        const ideas = this.getAllIdeas();
        return ideas.find(i => i.id === ideaId);
    }
};