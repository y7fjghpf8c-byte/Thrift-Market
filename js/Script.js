/* Thrift Market - shared front-end enhancements */

(function() {
    "use strict";

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function safeAddEvent(el, event, handler) {
        if (!el) return;
        el.addEventListener(event, handler);
    }

    function parsePrice(text) {
        // Expected like: Price:R500
        const m = String(text || "").match(/Price\s*:\s*R\s*(\d+(?:\.\d+)?)/i);
        return m ? Number(m[1]) : NaN;
    }

    function parseCondition(text) {
        // Expected like: Condition:9/10
        const m = String(text || "").match(/Condition\s*:\s*(\d+(?:\.\d+)?)\s*\/\s*10\b/i);
        return m ? Number(m[1]) : NaN;
    }

    // -------------------------
    // Contact: 2-step flow
    // -------------------------

    function initContactStepper() {
        const formDetails = $("#Form");
        const step1 = $("#Step-1");
        const step2 = $("#Step-2");
        const commentTextarea = $("#Comment");
        const detailsStatus = $("#Details-Status");
        const commentStatus = $("#Comment-Status");
        const commentCount = $("#Comment-Count");

        const nameInput = $("#Name");
        const surnameInput = $("#Surname");
        const emailInput = $("#Email");
        const phoneInput = $("#Phone");
        const commentForm = $("#Comment-form");

        if (!formDetails || !step1 || !step2 || !commentTextarea || !commentForm) return;

        const MAX = Number(commentTextarea.getAttribute("maxlength") || "500");

        // Initial counter
        commentTextarea.disabled = true;
        const updateCounter = () => {
            const v = String(commentTextarea.value || "");
            if (commentCount) commentCount.textContent = `${v.length} / ${MAX}`;
        };
        updateCounter();

        const validators = {
            name: (v) => v.trim().length >= 2,
            surname: (v) => v.trim().length >= 2,
            email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
            phone: (v) => String(v).trim().replace(/\s+/g, "").length >= 7,
        };

        const setStep2Enabled = (enabled) => {
            commentTextarea.disabled = !enabled;
            // Enable/disable submit button as well
            const submitBtn = $("#Submit", commentForm);
            if (submitBtn) submitBtn.disabled = !enabled;

            if (enabled) {
                if (detailsStatus) detailsStatus.textContent = "Details verified. You can send your message.";
                detailsStatus && (detailsStatus.style.color = "seagreen");
            } else {
                if (detailsStatus) detailsStatus.textContent = "Enter valid details to unlock the message box.";
                detailsStatus && (detailsStatus.style.color = "#b25a00");
            }
        };

        const validateDetails = () => {
            const nameOk = validators.name(nameInput.value);
            const surnameOk = validators.surname(surnameInput.value);
            const emailOk = validators.email(emailInput.value);
            const phoneOk = validators.phone(phoneInput.value);

            const allOk = nameOk && surnameOk && emailOk && phoneOk;
            return {
                allOk,
                nameOk,
                surnameOk,
                emailOk,
                phoneOk,
            };
        };

        const renderDetailsStatus = () => {
            const { allOk, nameOk, surnameOk, emailOk, phoneOk } = validateDetails();
            if (!detailsStatus) return;

            if (!allOk) {
                const parts = [];
                if (!nameOk) parts.push("Name");
                if (!surnameOk) parts.push("Surname");
                if (!emailOk) parts.push("Email");
                if (!phoneOk) parts.push("Phone");
                detailsStatus.textContent = `Missing/invalid: ${parts.join(", ")}`;
                detailsStatus.style.color = "#b25a00";
                setStep2Enabled(false);
                return;
            }

            detailsStatus.textContent = "Details verified. Step 2 unlocked.";
            detailsStatus.style.color = "seagreen";
            setStep2Enabled(true);
        };

        // Step 1 inputs: live validation
        [nameInput, surnameInput, emailInput, phoneInput].forEach((i) => {
            safeAddEvent(i, "input", renderDetailsStatus);
            safeAddEvent(i, "blur", renderDetailsStatus);
        });

        // Try enabling when form attempts submit
        safeAddEvent(formDetails, "submit", (e) => {
            e.preventDefault();
            renderDetailsStatus();

            const { allOk } = validateDetails();
            if (allOk) {
                // Smoothly focus textarea
                commentTextarea.focus({ preventScroll: true });
                commentTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });

        // Comment textarea: counter + status clearing
        safeAddEvent(commentTextarea, "input", () => {
            updateCounter();
            if (commentStatus) {
                commentStatus.textContent = "";
                commentStatus.style.color = "#111";
            }
        });

        // Max char guard
        safeAddEvent(commentTextarea, "keydown", (e) => {
            if (commentTextarea.disabled) return;
            const MAXE = MAX;
            const curr = commentTextarea.value.length;
            if (curr >= MAXE && e.key.length === 1) e.preventDefault();
        });

        // Prevent empty comment
        safeAddEvent(commentForm, "submit", (e) => {
            e.preventDefault();

            const enabled = !commentTextarea.disabled;
            if (!enabled) {
                commentStatus && ((commentStatus.textContent = "Complete Step 1 first."), (commentStatus.style.color = "#b25a00"));
                return;
            }

            const txt = String(commentTextarea.value || "").trim();
            if (txt.length === 0) {
                commentStatus && ((commentStatus.textContent = "Message cannot be empty."), (commentStatus.style.color = "#b25a00"));
                return;
            }

            if (txt.length > MAX) {
                commentStatus && ((commentStatus.textContent = `Message too long (max ${MAX} characters)."`), (commentStatus.style.color = "#b25a00"));
                return;
            }

            // UX: fake success since there is no backend
            if (commentStatus) {
                commentStatus.textContent = "Message sent successfully (demo). Thank you!";
                commentStatus.style.color = "seagreen";
            }

            // Reset state
            commentTextarea.value = "";
            updateCounter();
            setStep2Enabled(true);
        });

        // Initialize status + button states
        renderDetailsStatus();
    }

    // -------------------------
    // Lightbox modal (gallery)
    // -------------------------

    function initLightbox() {
        const existing = document.getElementById("lightbox-overlay");
        if (existing) return;

        // Create overlay once for entire site
        const overlay = document.createElement("div");
        overlay.id = "lightbox-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.style.display = "none";

        overlay.innerHTML = `
      <div id="lightbox-modal">
        <button id="lightbox-close" aria-label="Close" type="button">×</button>
        <img id="lightbox-img" alt="" />
        <div id="lightbox-caption" aria-live="polite"></div>
      </div>
    `;

        document.body.appendChild(overlay);

        const imgEl = $("#lightbox-img", overlay);
        const captionEl = $("#lightbox-caption", overlay);
        const closeBtn = $("#lightbox-close", overlay);

        const open = ({ src, alt, caption } = {}) => {
            if (!src) return;
            overlay.style.display = "block";
            overlay.classList.add("open");
            document.body.style.overflow = "hidden";

            imgEl.src = src;
            imgEl.alt = alt || "";
            captionEl.textContent = caption || alt || "";

            // focus close for accessibility
            closeBtn && closeBtn.focus();
        };

        const close = () => {
            overlay.classList.remove("open");
            document.body.style.overflow = "";
            // keep display block shortly for transitions
            window.setTimeout(() => {
                overlay.style.display = "none";
                imgEl.src = "";
            }, 160);
        };

        safeAddEvent(closeBtn, "click", close);
        safeAddEvent(overlay, "click", (e) => {
            if (e.target === overlay) close();
        });
        safeAddEvent(document, "keydown", (e) => {
            if (e.key === "Escape") {
                if (overlay.classList.contains("open")) close();
            }
        });

        // Delegate click for product images (and any images with data-lightbox)
        document.addEventListener("click", (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            const img = target.closest && target.closest("img");
            if (!img) return;

            const src = img.getAttribute("data-lightbox-src") || img.getAttribute("src");
            if (!src) return;

            // Only open for images in product cards or explicitly marked
            const inCard = img.closest(".Items-border, .Items, .Schedule");
            const marked = img.hasAttribute("data-lightbox") || img.hasAttribute("data-gallery");
            if (!inCard && !marked) return;

            e.preventDefault();

            const altText = img.getAttribute("alt") || "";
            let captionText = "";
            if (inCard) {
                const container = img.closest(".Items-border, .Items, .Schedule");
                captionText = container ? (container.innerText || "").trim().slice(0, 60) : "";
            }

            open({
                src,
                alt: altText,
                caption: captionText,
            });
        });
    }

    // -------------------------
    // Product search + sort + dynamic filtering
    // -------------------------

    function initProductSearchSort() {
        // Identify product cards
        const cards = $$(".Items-border");
        if (!cards.length) return;

        const container = cards[0].closest("main") || document.body;

        // Insert UI above first card if not present
        if (document.getElementById("product-controls")) return;

        const controls = document.createElement("section");
        controls.id = "product-controls";
        controls.innerHTML = `
      <div class="pc-row">
        <label class="pc-label" for="pc-search">Search</label>
        <input id="pc-search" class="pc-input" type="search" placeholder="Type item name..." />
      </div>
      <div class="pc-row">
        <label class="pc-label" for="pc-filter">Filter</label>
        <select id="pc-filter" class="pc-select">
          <option value="">All</option>
          <option value="R">Price range</option>
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="8.5">8.5</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </div>
      <div class="pc-row">
        <label class="pc-label" for="pc-sort">Sort</label>
        <select id="pc-sort" class="pc-select">
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="cond-desc">Condition: High → Low</option>
          <option value="name-asc">Name: A → Z</option>
        </select>
      </div>
      <div class="pc-row pc-actions">
        <button id="pc-clear" type="button" class="pc-btn">Clear</button>
        <div id="pc-count" class="pc-count" aria-live="polite"></div>
      </div>
    `;

        container.insertBefore(controls, cards[0]);

        const searchInput = $("#pc-search");
        const filterSelect = $("#pc-filter");
        const sortSelect = $("#pc-sort");
        const clearBtn = $("#pc-clear");
        const countEl = $("#pc-count");

        // Precompute card data
        const cardData = cards.map((card) => {
            const text = card.innerText || "";
            const price = parsePrice(text);
            const condition = parseCondition(text);
            // Best-effort name: first uppercase block or first line
            const lines = text
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
            const name = lines.find((l) => !/^Size:/i.test(l) && !/^Condition:/i.test(l) && !/^Price:/i.test(l)) || lines[0] || "";

            // size token: try from Size:
            const sizeMatch = text.match(/Size\s*:\s*([^\n]+?)\s*(?:\r?\n|$)/i);
            const size = sizeMatch ? sizeMatch[1].trim() : "";

            return { card, text, price, condition, name, size };
        });

        const apply = () => {
            const q = String(searchInput.value || "").trim().toLowerCase();
            const filterVal = String(filterSelect.value || "");
            const sortVal = String(sortSelect.value || "price-asc");

            let results = cardData.filter((d) => {
                const matchesSearch = !q || d.text.toLowerCase().includes(q) || d.name.toLowerCase().includes(q);

                let matchesFilter = true;
                if (filterVal) {
                    if (filterVal === "R") {
                        // treat R as any price presence
                        matchesFilter = !Number.isNaN(d.price);
                    } else {
                        matchesFilter =
                            d.size === filterVal ||
                            d.text.includes(`Size:${filterVal}`) ||
                            d.text.includes(`Size: ${filterVal}`);
                    }
                }

                return matchesSearch && matchesFilter;
            });

            // Sort
            results.sort((a, b) => {
                if (sortVal === "price-asc") return (Number.isNaN(a.price) ? Infinity : a.price) - (Number.isNaN(b.price) ? Infinity : b.price);
                if (sortVal === "price-desc") return (Number.isNaN(b.price) ? -Infinity : b.price) - (Number.isNaN(a.price) ? -Infinity : a.price);
                if (sortVal === "cond-desc") return (Number.isNaN(b.condition) ? -Infinity : b.condition) - (Number.isNaN(a.condition) ? -Infinity : a.condition);
                if (sortVal === "name-asc") return a.name.localeCompare(b.name);
                return 0;
            });

            // Rebuild DOM order and apply hide/show
            const allCardsSet = new Set(cards);
            // Hide all first
            cards.forEach((c) => {
                c.classList.remove("show");
                c.classList.add("hide");
            });

            // Put sorted results in correct order
            // We insert using document fragment into the parent of the first card.
            const parent = cards[0].parentElement;
            if (parent) {
                const frag = document.createDocumentFragment();
                results.forEach((d) => {
                    if (!allCardsSet.has(d.card)) return;
                    d.card.classList.remove("hide");
                    d.card.classList.add("show");
                    frag.appendChild(d.card);
                });
                // Append to preserve other nodes: we only reorder the cards.
                parent.appendChild(frag);
            } else {
                results.forEach((d) => {
                    d.card.classList.remove("hide");
                    d.card.classList.add("show");
                });
            }

            countEl.textContent = `${results.length} item${results.length === 1 ? "" : "s"}`;
        };

        safeAddEvent(searchInput, "input", apply);
        safeAddEvent(filterSelect, "change", apply);
        safeAddEvent(sortSelect, "change", apply);
        safeAddEvent(clearBtn, "click", () => {
            searchInput.value = "";
            filterSelect.value = "";
            sortSelect.value = "price-asc";
            apply();
        });

        // Initial
        apply();
    }

    // -------------------------
    // Scroll-in animations
    // -------------------------

    function initScrollAnimations() {
        const targets = $$(".Items-border, .Items, .Schedule, #Container-About");
        if (!targets.length) return;

        targets.forEach((el) => {
            el.classList.add("reveal");
        });

        if (!("IntersectionObserver" in window)) return;

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in-view");
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 }
        );

        targets.forEach((el) => io.observe(el));
    }

    // -------------------------
    // Init all
    // -------------------------

    document.addEventListener("DOMContentLoaded", () => {
        initContactStepper();
        initLightbox();
        initProductSearchSort();
        initScrollAnimations();
    });
})();
