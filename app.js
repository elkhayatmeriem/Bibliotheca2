/**
 * Bibliotheca Dashboard - Complete JavaScript
 * Features: SPA, CRUD Books & Authors, Dashboard, Charts, API, LocalStorage
 */

// ============================================
// DATA INITIALIZATION & LOCALSTORAGE
// ============================================

// Initialize data from LocalStorage or default values
let books = JSON.parse(localStorage.getItem('books')) || [];
let authors = JSON.parse(localStorage.getItem('authors')) || [];

// Chart instance
let genreChart = null;

// Edit mode tracking
let editingBookIndex = -1;

// API Books limit - exactly 5 books
const API_BOOKS_LIMIT = 5;

// ============================================
// NAVIGATION (SPA)
// ============================================

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to current button
    const activeBtn = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Update section-specific content
    if (sectionId === 'dashboard') {
        updateDashboard();
        updateGenreChart();
    } else if (sectionId === 'books') {
        displayBooks();
        updateBooksCount();
    } else if (sectionId === 'authors') {
        displayAuthors();
        updateAuthorsCount();
    }
    
    // Close mobile sidebar
    closeMobileSidebar();
}

// ============================================
// BOOKS CRUD OPERATIONS
// ============================================

document.getElementById('bookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const year = document.getElementById('year').value.trim();
    const genre = document.getElementById('genre').value.trim();
    
    // Validate required fields
    if (!title || !author) {
        showToast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }
    
    const bookData = {
        title,
        author,
        year: year || 'N/A',
        genre: genre || 'Non catégorisé',
        fromAPI: false
    };
    
    if (editingBookIndex >= 0) {
        // Update existing book
        books[editingBookIndex] = bookData;
        showToast('Livre modifié avec succès!', 'success');
    } else {
        // Add new book
        books.push(bookData);
        showToast('Livre ajouté avec succès!', 'success');
    }
    
    // Save to LocalStorage
    saveBooks();
    
    // Reset form and UI
    resetBookForm();
    displayBooks();
    updateBooksCount();
    updateDashboard();
    updateGenreChart();
});

function displayBooks(filteredBooks = null) {
    const list = document.getElementById('bookList');
    const booksToDisplay = filteredBooks || books;
    
    if (booksToDisplay.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>Aucun livre à afficher</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = booksToDisplay.map((book, index) => {
        const actualIndex = filteredBooks ? 
            books.findIndex(b => b.title === book.title && b.author === book.author) : 
            index;
        
        return `
            <div class="book-item ${book.fromAPI ? 'from-api' : ''}" 
                 onclick="showBookDetails(${actualIndex})">
                <div class="book-info">
                    <div class="book-title">${escapeHtml(book.title)}</div>
                    <div class="book-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(book.author)}</span>
                        <span><i class="fas fa-calendar"></i> ${book.year}</span>
                        <span><i class="fas fa-tag"></i> ${escapeHtml(book.genre)}</span>
                    </div>
                </div>
                <div class="book-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-outline btn-sm" 
                            onclick="editBook(${actualIndex})" 
                            ${book.fromAPI ? 'disabled' : ''}>
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBook(${actualIndex})">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function editBook(index) {
    const book = books[index];
    
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('year').value = book.year !== 'N/A' ? book.year : '';
    document.getElementById('genre').value = book.genre !== 'Non catégorisé' ? book.genre : '';
    
    editingBookIndex = index;
    
    // Update button text
    const submitBtn = document.querySelector('#bookForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    }
    
    // Scroll to form
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    
    showToast('Mode modification activé', 'warning');
}

function deleteBook(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
        books.splice(index, 1);
        saveBooks();
        
        displayBooks();
        updateBooksCount();
        updateDashboard();
        updateGenreChart();
        
        showToast('Livre supprimé avec succès!', 'success');
    }
}

function resetBookForm() {
    document.getElementById('bookForm').reset();
    editingBookIndex = -1;
    
    // Reset button text
    const submitBtn = document.querySelector('#bookForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
}

function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
}

function updateBooksCount() {
    document.getElementById('booksCount').textContent = books.length;
}

// ============================================
// BOOKS SEARCH & SORT
// ============================================

document.getElementById('searchBook').addEventListener('input', function() {
    const keyword = this.value.trim().toLowerCase();
    
    if (!keyword) {
        displayBooks();
        return;
    }
    
    const filtered = books.filter(book => 
        book.title.toLowerCase().includes(keyword) || 
        book.author.toLowerCase().includes(keyword)
    );
    
    displayBooks(filtered);
});

function sortBooks() {
    books.sort((a, b) => a.title.localeCompare(b.title));
    saveBooks();
    displayBooks();
    showToast('Livres triés par ordre alphabétique!', 'success');
}

// ============================================
// BOOK DETAILS MODAL
// ============================================

function showBookDetails(index) {
    const book = books[index];
    const modal = document.getElementById('bookModal');
    const detailsContainer = document.getElementById('modalBookDetails');
    
    detailsContainer.innerHTML = `
        <div class="detail-row">
            <div class="detail-label"><i class="fas fa-heading"></i> Titre</div>
            <div class="detail-value">${escapeHtml(book.title)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label"><i class="fas fa-user"></i> Auteur</div>
            <div class="detail-value">${escapeHtml(book.author)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label"><i class="fas fa-calendar"></i> Année de publication</div>
            <div class="detail-value">${book.year}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label"><i class="fas fa-tag"></i> Genre</div>
            <div class="detail-value">${escapeHtml(book.genre)}</div>
        </div>
        ${book.fromAPI ? `
        <div class="detail-row">
            <div class="api-badge">
                <i class="fas fa-globe"></i> Provenance: OpenLibrary API
            </div>
        </div>
        ` : ''}
    `;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('bookModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

document.getElementById('bookModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// ============================================
// AUTHORS CRUD OPERATIONS
// ============================================

document.getElementById('authorForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('authorName').value.trim();
    
    if (!name) {
        showToast('Veuillez entrer un nom d\'auteur', 'error');
        return;
    }
    
    // Check for duplicates
    if (authors.some(author => author.toLowerCase() === name.toLowerCase())) {
        showToast('Cet auteur existe déjà', 'warning');
        return;
    }
    
    authors.push(name);
    saveAuthors();
    
    e.target.reset();
    displayAuthors();
    updateAuthorsCount();
    updateDashboard();
    
    showToast('Auteur ajouté avec succès!', 'success');
});

function displayAuthors() {
    const list = document.getElementById('authorList');
    
    if (authors.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-pen-fancy"></i>
                <p>Aucun auteur à afficher</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = authors.map((author, index) => `
        <div class="author-item">
            <div class="author-name">
                <i class="fas fa-user-circle"></i>
                ${escapeHtml(author)}
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteAuthor(${index})">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
    `).join('');
}

function deleteAuthor(index) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'auteur "${authors[index]}" ?`)) {
        authors.splice(index, 1);
        saveAuthors();
        
        displayAuthors();
        updateAuthorsCount();
        updateDashboard();
        
        showToast('Auteur supprimé avec succès!', 'success');
    }
}

function saveAuthors() {
    localStorage.setItem('authors', JSON.stringify(authors));
}

function updateAuthorsCount() {
    document.getElementById('authorsCount').textContent = authors.length;
}

// ============================================
// DASHBOARD
// ============================================

function updateDashboard() {
    // Count books
    document.getElementById('kpiBooks').textContent = books.length;
    
    // Count authors
    document.getElementById('kpiAuthors').textContent = authors.length;
    
    // Count API books - strictly from books array
    const apiBooks = books.filter(book => book.fromAPI);
    document.getElementById('kpiApi').textContent = apiBooks.length;
}

// ============================================
// CHARTS - Chart.js
// ============================================

function updateGenreChart() {
    const ctx = document.getElementById('genreChart');
    if (!ctx) return;
    
    // Count books by genre
    const genreCounts = {};
    books.forEach(book => {
        const genre = book.genre || 'Non catégorisé';
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    
    const labels = Object.keys(genreCounts);
    const data = Object.values(genreCounts);
    
    // Destroy existing chart if it exists
    if (genreChart) {
        genreChart.destroy();
    }
    
    // Generate colors for each genre
    const colors = [
        '#4a6fa5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    
    const backgroundColors = labels.map((_, i) => colors[i % colors.length]);
    
    // Create new chart
    genreChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de livres',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors,
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        font: {
                            size: 11
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// OPENLIBRARY API INTEGRATION
// ============================================

function fetchBooksFromAPI() {
    // Count existing API books
    const existingApiBooks = books.filter(book => book.fromAPI);
    
    // Only fetch if we have less than 5 API books
    if (existingApiBooks.length >= API_BOOKS_LIMIT) {
        console.log('Already have ' + API_BOOKS_LIMIT + ' API books, skipping fetch');
        return;
    }
    
    showToast('Récupération des livres depuis OpenLibrary...', 'info');
    
    // Fetch from OpenLibrary
    fetch('https://openlibrary.org/search.json?q=literature&limit=10&fields=title,author_name,first_publish_year,subject')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erreur de connexion à OpenLibrary');
            }
            return response.json();
        })
        .then(data => {
            if (!data.docs || data.docs.length === 0) {
                showToast('Aucun livre trouvé via l\'API', 'warning');
                return;
            }
            
            // Get titles of existing API books to avoid duplicates
            const existingApiTitles = books
                .filter(book => book.fromAPI)
                .map(book => book.title.toLowerCase());
            
            // Add new API books until we reach 5 total
            let addedCount = 0;
            
            for (const doc of data.docs) {
                // Stop if we already have 5 API books
                if (books.filter(b => b.fromAPI).length >= API_BOOKS_LIMIT) {
                    break;
                }
                
                const title = doc.title || 'Titre inconnu';
                
                // Skip if this title already exists
                if (existingApiTitles.includes(title.toLowerCase())) {
                    continue;
                }
                
                // Add the book
                books.push({
                    title: title,
                    author: doc.author_name ? doc.author_name[0] : 'Auteur inconnu',
                    year: doc.first_publish_year ? doc.first_publish_year.toString() : 'N/A',
                    genre: doc.subject && doc.subject.length > 0 ? doc.subject[0] : 'Non catégorisé',
                    fromAPI: true
                });
                
                addedCount++;
            }
            
            // Save to LocalStorage
            saveBooks();
            
            // Update UI
            displayBooks();
            updateBooksCount();
            updateDashboard();
            updateGenreChart();
            
            const apiCount = books.filter(b => b.fromAPI).length;
            showToast(`${apiCount} livres API chargés!`, 'success');
        })
        .catch(error => {
            console.error('API Error:', error);
            showToast('Erreur lors de la récupération des livres API', 'error');
        });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    
    toast.textContent = message;
    toast.className = 'toast ' + type;
    toast.classList.add('show');
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function closeMobileSidebar() {
    document.querySelector('.sidebar').classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('show');
}

// ============================================
// CLEAR DATA
// ============================================

function clearAllData() {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les données ? Cette action est irréversible.')) {
        // Clear LocalStorage
        localStorage.removeItem('books');
        localStorage.removeItem('authors');
        
        // Reset arrays
        books = [];
        authors = [];
        
        // Update UI
        displayBooks();
        displayAuthors();
        updateBooksCount();
        updateAuthorsCount();
        updateDashboard();
        updateGenreChart();
        resetBookForm();
        
        showToast('Toutes les données ont été supprimées!', 'success');
        
        // Re-fetch API books after clearing
        setTimeout(() => {
            fetchBooksFromAPI();
        }, 500);
    }
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    // Display initial data
    displayBooks();
    displayAuthors();
    
    // Update counts and dashboard
    updateBooksCount();
    updateAuthorsCount();
    updateDashboard();
    updateGenreChart();
    
    // Fetch books from API
    fetchBooksFromAPI();
    
    console.log('Bibliotheca Dashboard initialized successfully!');
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Also run init immediately if DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
}

