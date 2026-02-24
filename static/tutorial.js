/* ===== TUTORIAL JAVASCRIPT ===== */

class JMESPathTutorial {
    constructor() {
        this.currentSection = 'basics';
        this.progress = {
            basics: false,
            filters: false,
            projections: false,
            functions: false,
            advanced: false
        };
        
        this.examples = {
            basics: [
                {
                    title: "Acessando Propriedades Simples",
                    description: "Aprenda a acessar propriedades básicas de um objeto",
                    input: `{
  "user": {
    "name": "João Silva",
    "email": "joao@example.com",
    "age": 30
  }
}`,
                    expression: "user.name",
                    output: `"João Silva"`,
                    explanation: "Use ponto (.) para acessar propriedades aninhadas"
                },
                {
                    title: "Acessando Arrays",
                    description: "Como trabalhar com listas e arrays",
                    input: `{
  "products": [
    {"name": "Laptop", "price": 1200},
    {"name": "Mouse", "price": 25},
    {"name": "Keyboard", "price": 75}
  ]
}`,
                    expression: "products[0].name",
                    output: `"Laptop"`,
                    explanation: "Use colchetes [] para acessar elementos por índice (começa em 0)"
                }
            ],
            filters: [
                {
                    title: "Filtrando por Valor",
                    description: "Filtre elementos com base em condições",
                    input: `{
  "users": [
    {"name": "Ana", "age": 25, "active": true},
    {"name": "Bruno", "age": 32, "active": false},
    {"name": "Carla", "age": 28, "active": true}
  ]
}`,
                    expression: "users[?active==true]",
                    output: `[
  {"name": "Ana", "age": 25, "active": true},
  {"name": "Carla", "age": 28, "active": true}
]`,
                    explanation: "Use [?condição] para filtrar elementos que satisfazem a condição"
                },
                {
                    title: "Filtrando por Comparação",
                    description: "Use operadores de comparação para filtros avançados",
                    input: `{
  "products": [
    {"name": "Laptop", "price": 1200, "category": "electronics"},
    {"name": "Book", "price": 25, "category": "education"},
    {"name": "Phone", "price": 800, "category": "electronics"}
  ]
}`,
                    expression: "products[?price>100]",
                    output: `[
  {"name": "Laptop", "price": 1200, "category": "electronics"},
  {"name": "Phone", "price": 800, "category": "electronics"}
]`,
                    explanation: "Use operadores: >, <, >=, <=, ==, != para comparações"
                }
            ],
            projections: [
                {
                    title: "Selecionando Múltiplos Campos",
                    description: "Extraia campos específicos de objetos",
                    input: `{
  "user": {
    "id": 123,
    "name": "Maria Santos",
    "email": "maria@example.com",
    "password": "secret123",
    "created_at": "2024-01-15"
  }
}`,
                    expression: "user.[name, email]",
                    output: `["Maria Santos", "maria@example.com"]`,
                    explanation: "Use [campo1, campo2] para selecionar múltiplos campos como array"
                },
                {
                    title: "Criando Novos Objetos",
                    description: "Transforme objetos com nova estrutura",
                    input: `{
  "people": [
    {"first_name": "João", "last_name": "Silva", "age": 30},
    {"first_name": "Ana", "last_name": "Costa", "age": 25}
  ]
}`,
                    expression: "people[*].{fullName: first_name + ' ' + last_name, idade: age}",
                    output: `[
  {"fullName": "João Silva", "idade": 30},
  {"fullName": "Ana Costa", "idade": 25}
]`,
                    explanation: "Use {novoNome: expressão} para criar novos objetos com campos renomeados"
                }
            ],
            functions: [
                {
                    title: "Funções de Agregação",
                    description: "Use funções para calcular valores",
                    input: `{
  "sales": [
    {"amount": 1200, "product": "Laptop"},
    {"amount": 800, "product": "Phone"},
    {"amount": 300, "product": "Tablet"}
  ]
}`,
                    expression: "sum(sales[*].amount)",
                    output: `2300`,
                    explanation: "Funções úteis: sum(), length(), max(), min(), avg()"
                },
                {
                    title: "Funções de String",
                    description: "Manipule texto com funções integradas",
                    input: `{
  "users": ["joão silva", "ana costa", "bruno santos"]
}`,
                    expression: "users[*].upper_case(@)",
                    output: `["JOÃO SILVA", "ANA COSTA", "BRUNO SANTOS"]`,
                    explanation: "Funções de string: upper_case(), lower_case(), split(), join()"
                }
            ],
            advanced: [
                {
                    title: "Pipe e Composição",
                    description: "Combine múltiplas operações",
                    input: `{
  "data": [
    {"name": "A", "value": 10, "active": false},
    {"name": "B", "value": 25, "active": true},
    {"name": "C", "value": 15, "active": true},
    {"name": "D", "value": 30, "active": false}
  ]
}`,
                    expression: "data[?active==true] | sort_by(@, &value) | reverse(@)",
                    output: `[
  {"name": "B", "value": 25, "active": true},
  {"name": "C", "value": 15, "active": true}
]`,
                    explanation: "Use | para encadear operações: filtro → ordenação → reversão"
                },
                {
                    title: "Expressões Condicionais",
                    description: "Crie lógica condicional complexa",
                    input: `{
  "products": [
    {"name": "Laptop", "price": 1200, "stock": 5},
    {"name": "Mouse", "price": 25, "stock": 0},
    {"name": "Keyboard", "price": 75, "stock": 15}
  ]
}`,
                    expression: "products[*].{name: name, status: stock > 0 ? `Available` : `Out of Stock`, price: price}",
                    output: `[
  {"name": "Laptop", "status": "Available", "price": 1200},
  {"name": "Mouse", "status": "Out of Stock", "price": 25},
  {"name": "Keyboard", "status": "Available", "price": 75}
]`,
                    explanation: "Use condição ? valor_true : valor_false para expressões ternárias"
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadProgress();
        this.renderCurrentSection();
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.tutorial-nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Copy code buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyToClipboard(e.target);
            }
        });
        
        // Interactive examples
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('example-btn')) {
                this.runExample(e.target);
            }
        });
        
        // Progress tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('complete-section')) {
                this.markSectionComplete(e.target.dataset.section);
            }
        });
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.tutorial-nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');
        
        // Update content
        document.querySelectorAll('.tutorial-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${section}-content`).classList.add('active');
        
        this.currentSection = section;
        this.renderCurrentSection();
    }
    
    renderCurrentSection() {
        const content = document.getElementById(`${this.currentSection}-content`);
        if (!content) return;
        
        // Render examples for current section
        const examplesContainer = content.querySelector('.examples-container');
        if (examplesContainer) {
            examplesContainer.innerHTML = this.renderExamples(this.currentSection);
        }
        
        // Update progress tracker
        this.updateProgressTracker();
    }
    
    renderExamples(section) {
        const examples = this.examples[section] || [];
        return examples.map((example, index) => `
            <div class="interactive-example">
                <h4>
                    <i class="fas fa-play-circle"></i>
                    ${example.title}
                </h4>
                <p>${example.description}</p>
                
                <div class="example-controls">
                    <div class="example-input-group">
                        <label><strong>JSON de Entrada:</strong></label>
                        <textarea class="example-input" readonly>${example.input}</textarea>
                    </div>
                    <div class="example-input-group">
                        <label><strong>Expressão JMESPath:</strong></label>
                        <input type="text" class="example-expression" value="${example.expression}" readonly>
                        <label style="margin-top: 1rem;"><strong>Resultado:</strong></label>
                        <textarea class="example-output" readonly>${example.output}</textarea>
                    </div>
                </div>
                
                <div class="example-actions">
                    <button class="example-btn" data-section="${section}" data-index="${index}">
                        <i class="fas fa-play"></i>
                        Executar
                    </button>
                    <button class="example-btn secondary" data-section="${section}" data-index="${index}">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                </div>
                
                <div class="tips-box">
                    <h4><i class="fas fa-lightbulb"></i> Explicação</h4>
                    <p>${example.explanation}</p>
                </div>
            </div>
        `).join('');
    }
    
    runExample(button) {
        const section = button.dataset.section;
        const index = parseInt(button.dataset.index);
        const example = this.examples[section][index];
        
        if (!example) return;
        
        try {
            // Parse input JSON
            const inputData = JSON.parse(example.input);
            
            // Execute JMESPath expression
            const result = jmespath.search(inputData, example.expression);
            
            // Format output
            const formattedResult = JSON.stringify(result, null, 2);
            
            // Update output field
            const exampleContainer = button.closest('.interactive-example');
            const outputField = exampleContainer.querySelector('.example-output');
            outputField.value = formattedResult;
            
            // Show success notification
            this.showNotification('Expressão executada com sucesso!', 'success');
            
            // Mark section as started
            this.updateSectionProgress(section, 'started');
            
        } catch (error) {
            this.showNotification(`Erro: ${error.message}`, 'error');
        }
    }
    
    copyToClipboard(button) {
        const codeBlock = button.parentElement;
        const code = codeBlock.textContent || codeBlock.innerText;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copiado!';
            button.style.background = 'var(--success-500)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 2000);
        });
    }
    
    markSectionComplete(section) {
        this.progress[section] = true;
        this.saveProgress();
        this.updateProgressTracker();
        this.showNotification(`Seção ${section} marcada como completa!`, 'success');
    }
    
    updateSectionProgress(section, status) {
        // Track progress as user interacts
        if (status === 'started' && !this.progress[section]) {
            this.progress[section] = 'started';
            this.saveProgress();
        }
    }
    
    updateProgressTracker() {
        document.querySelectorAll('.progress-step').forEach(step => {
            const section = step.dataset.section;
            step.classList.remove('completed', 'active');
            
            if (this.progress[section] === true) {
                step.classList.add('completed');
            } else if (section === this.currentSection) {
                step.classList.add('active');
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    saveProgress() {
        localStorage.setItem('jmespath-tutorial-progress', JSON.stringify(this.progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('jmespath-tutorial-progress');
        if (saved) {
            this.progress = JSON.parse(saved);
        }
    }
    
    resetProgress() {
        this.progress = {
            basics: false,
            filters: false,
            projections: false,
            functions: false,
            advanced: false
        };
        this.saveProgress();
        this.updateProgressTracker();
    }
}

// Initialize tutorial when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.tutorial-container')) {
        window.jmespathTutorial = new JMESPathTutorial();
    }
});
