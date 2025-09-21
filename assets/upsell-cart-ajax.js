/**
 * Sistema de Upsell Dinâmico para Tema Prestige do Shopify
 * Adiciona produtos ao carrinho via Ajax e atualiza o bloco de upsell automaticamente
 */

class UpsellCartManager {
  constructor() {
    this.init();
  }

  init() {
    // Aguarda o DOM estar carregado
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Adiciona event listeners para botões de upsell
    document.addEventListener('click', (event) => {
      if (event.target.matches('.upsell-add-to-cart, .upsell-add-to-cart *')) {
        event.preventDefault();
        const button = event.target.closest('.upsell-add-to-cart');
        this.handleUpsellAddToCart(button);
      }
    });
  }

  /**
   * Manipula o clique no botão "Adicionar ao Carrinho" do upsell
   * @param {HTMLElement} button - O botão clicado
   */
  async handleUpsellAddToCart(button) {
    if (button.disabled) return;

    const variantId = button.dataset.variantId;
    const quantity = parseInt(button.dataset.quantity) || 1;

    if (!variantId) {
      console.error('ID da variante não encontrado');
      return;
    }

    // Desabilita o botão durante a requisição
    this.setButtonLoading(button, true);

    try {
      // Adiciona o produto ao carrinho
      const response = await this.addToCart(variantId, quantity);
      
      if (response.ok) {
        const cartData = await response.json();
        
        // Dispara evento personalizado para atualizar o carrinho
        this.triggerCartUpdate();
        
        // Atualiza o bloco de upsell
        await this.refreshUpsellBlock();
        
        // Feedback visual de sucesso
        this.showSuccessMessage(button);
        
      } else {
        throw new Error('Erro ao adicionar produto ao carrinho');
      }
    } catch (error) {
      console.error('Erro:', error);
      this.showErrorMessage(button);
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  /**
   * Adiciona um produto ao carrinho via Ajax
   * @param {string} variantId - ID da variante do produto
   * @param {number} quantity - Quantidade a ser adicionada
   * @returns {Promise<Response>} - Resposta da API
   */
  async addToCart(variantId, quantity) {
    const formData = {
      items: [{
        id: variantId,
        quantity: quantity
      }]
    };

    return fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
  }

  /**
   * Dispara evento para atualizar o carrinho (compatível com tema Prestige)
   */
  triggerCartUpdate() {
    // Evento específico do tema Prestige para atualizar o drawer do carrinho
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    
    // Evento genérico para compatibilidade
    document.dispatchEvent(new CustomEvent('cart:updated'));
  }

  /**
   * Atualiza o bloco de upsell fazendo uma nova requisição
   */
  async refreshUpsellBlock() {
    const upsellContainer = document.querySelector('.upsell-products-container');
    
    if (!upsellContainer) {
      console.warn('Container de upsell não encontrado');
      return;
    }

    try {
      // Faz requisição para obter o HTML atualizado do bloco de upsell
      const response = await fetch(window.location.pathname + '?section_id=upsell-products', {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (response.ok) {
        const html = await response.text();
        
        // Substitui o conteúdo do container
        upsellContainer.innerHTML = html;
        
        // Re-inicializa eventos se necessário
        this.bindEvents();
      }
    } catch (error) {
      console.error('Erro ao atualizar bloco de upsell:', error);
    }
  }

  /**
   * Define o estado de carregamento do botão
   * @param {HTMLElement} button - O botão
   * @param {boolean} loading - Se está carregando
   */
  setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.classList.add('loading');
      
      // Salva o texto original
      if (!button.dataset.originalText) {
        button.dataset.originalText = button.textContent;
      }
      
      button.textContent = 'Adicionando...';
    } else {
      button.disabled = false;
      button.classList.remove('loading');
      
      // Restaura o texto original
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  /**
   * Mostra mensagem de sucesso
   * @param {HTMLElement} button - O botão
   */
  showSuccessMessage(button) {
    const originalText = button.textContent;
    button.textContent = 'Adicionado!';
    button.classList.add('success');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('success');
    }, 2000);
  }

  /**
   * Mostra mensagem de erro
   * @param {HTMLElement} button - O botão
   */
  showErrorMessage(button) {
    const originalText = button.textContent;
    button.textContent = 'Erro!';
    button.classList.add('error');
    
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove('error');
    }, 2000);
  }
}

// Inicializa o gerenciador de upsell
new UpsellCartManager();

