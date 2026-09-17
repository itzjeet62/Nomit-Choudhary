/**
 * NOMIT CHOUDHARY — AI VISUAL CONTENT CREATOR & PROMPT ENGINEER
 * Ultra-Smooth Scroll-Driven Canvas Frame Animation & Portfolio Interactions
 * - Fixed high-DPI canvas background sequence (240 frames)
 * - Buttery LERP momentum synchronization with natural page scroll
 * - High-speed concurrent image preloader with fallback guarantee
 * - Interactive AI Project Category Filters
 * - Interactive Before -> After (Image to Video) comparison slider
 * - Scroll-Spy active sticky top navigation & mobile drawer
 * - Header-offset smooth anchor scrolling
 * - Live Indian Standard Time (IST) digital clock
 * - 1-Click email copy to clipboard & magnetic CTA hover
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 240;
  const FRAME_DIR = './ezgif-6950dac87ae3a453-jpg/';
  const FRAME_PREFIX = 'ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // DOM Elements
  const canvas = document.getElementById('sequenceCanvas');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const loaderOverlay = document.getElementById('loaderOverlay');
  const loaderPercent = document.getElementById('loaderPercent');
  const progressBar = document.getElementById('progressBar');
  const scrollPrompt = document.getElementById('scrollPrompt');

  // Animation State
  const images = new Array(TOTAL_FRAMES);
  const loadedMap = new Uint8Array(TOTAL_FRAMES);
  let loadedCount = 0;

  let targetProgress = 0; // 0.0 to 1.0
  let currentProgress = 0; // interpolated progress
  let lastDrawnFrameIndex = -1;
  let dpr = 1;

  // LERP responsiveness (0.12 - 0.15 delivers instant response + smooth momentum)
  const LERP_DAMPING = 0.12;

  /**
   * Generates zero-padded frame file path (1-based)
   */
  function getFramePath(index1) {
    const padded = String(index1).padStart(3, '0');
    return `${FRAME_DIR}${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  let lastCanvasWidth = 0;
  let lastCanvasHeight = 0;

  /**
   * Adjusts canvas resolution to match viewport with devicePixelRatio
   * Includes mobile address-bar shield to avoid reallocations on scroll
   */
  function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Mobile address-bar shield: ignore small vertical height variations (<140px)
    // when width is unchanged to prevent canvas flash during mobile touch scroll
    if (lastCanvasWidth === width && Math.abs(lastCanvasHeight - height) < 140 && lastDrawnFrameIndex !== -1) {
      return;
    }
    lastCanvasWidth = width;
    lastCanvasHeight = height;

    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastDrawnFrameIndex = -1;
    renderCurrentState();
  }

  /**
   * Renders the image at the given frame index to canvas with centered cover fitting
   */
  function drawFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= TOTAL_FRAMES) return;

    let img = images[frameIndex];
    let isFallback = false;

    if (!loadedMap[frameIndex] || !img || !img.complete) {
      const nearestIdx = findNearestLoadedIndex(frameIndex);
      if (nearestIdx !== -1) {
        img = images[nearestIdx];
        isFallback = true;
      } else {
        return; // No frames loaded yet
      }
    }

    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const scale = Math.max(cWidth / imgWidth, cHeight / imgHeight);
    const renderWidth = imgWidth * scale;
    const renderHeight = imgHeight * scale;
    const offsetX = (cWidth - renderWidth) / 2;
    const offsetY = (cHeight - renderHeight) / 2;

    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);

    // Safeguard veil over star watermark coordinates (1740, 902)
    const wmX = offsetX + 1740 * scale;
    const wmY = offsetY + 902 * scale;
    const wmRadius = 50 * scale;
    if (wmX >= 0 && wmX <= cWidth && wmY >= 0 && wmY <= cHeight) {
      const grad = ctx.createRadialGradient(wmX, wmY, 0, wmX, wmY, wmRadius);
      grad.addColorStop(0, 'rgba(8, 1, 6, 0.45)');
      grad.addColorStop(0.6, 'rgba(8, 1, 6, 0.15)');
      grad.addColorStop(1, 'rgba(8, 1, 6, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(wmX, wmY, wmRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!isFallback) {
      lastDrawnFrameIndex = frameIndex;
    } else {
      lastDrawnFrameIndex = -1;
    }
  }

  /**
   * Finds the closest already-loaded frame index
   */
  function findNearestLoadedIndex(targetIdx) {
    if (loadedMap[targetIdx]) return targetIdx;

    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && loadedMap[prev]) return prev;

      const next = targetIdx + offset;
      if (next < TOTAL_FRAMES && loadedMap[next]) return next;
    }

    return loadedMap[0] ? 0 : -1;
  }

  /**
   * Calculates overall scroll progress [0.0, 1.0] across all scroll mechanisms
   */
  function getScrollProgress() {
    const doc = document.documentElement;
    const body = document.body;

    const scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(
      doc.scrollHeight,
      body.scrollHeight,
      doc.offsetHeight,
      body.offsetHeight
    );
    const maxScroll = scrollHeight - window.innerHeight;

    if (maxScroll <= 0) return 0;
    return Math.max(0, Math.min(1, scrollTop / maxScroll));
  }

  /**
   * Updates target progress from scroll position
   */
  function handleScroll() {
    targetProgress = getScrollProgress();

    const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (scrollPrompt) {
      if (scrollY > 50) {
        scrollPrompt.classList.add('is-scrolled');
      } else {
        scrollPrompt.classList.remove('is-scrolled');
      }
    }
  }

  /**
   * Render frame matching current interpolated progress
   */
  function renderCurrentState() {
    const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentProgress * (TOTAL_FRAMES - 1))));
    if (frameIndex !== lastDrawnFrameIndex) {
      drawFrame(frameIndex);
    }
  }

  /**
   * Concurrent image preloader with priority for instant playback
   */
  function initPreloader() {
    // 1. Immediately load frame 0 (First frame)
    loadSingleImage(0, () => {
      drawFrame(0);
    });

    // 2. Adaptive concurrent loader: 8 on mobile/tablet to conserve RAM/bandwidth, 16 on desktop
    const isMobileDevice = window.innerWidth < 1024;
    const CONCURRENCY = isMobileDevice ? 8 : 16;
    let nextToLoad = 1;

    function loadNext() {
      if (nextToLoad >= TOTAL_FRAMES) return;
      const index = nextToLoad++;
      loadSingleImage(index, () => {
        const currentTarget = Math.round(currentProgress * (TOTAL_FRAMES - 1));
        if (currentTarget === index || lastDrawnFrameIndex === -1) {
          drawFrame(currentTarget);
        }
        loadNext();
      });
    }

    for (let i = 0; i < CONCURRENCY; i++) {
      loadNext();
    }
  }

  function loadSingleImage(index, callback) {
    const img = new Image();
    img.src = getFramePath(index + 1);

    img.onload = () => {
      images[index] = img;
      loadedMap[index] = 1;
      loadedCount++;
      updateProgressUI();
      if (callback) callback();
    };

    img.onerror = () => {
      if (callback) callback();
    };
  }

  function updateProgressUI() {
    const percent = Math.min(100, Math.round((loadedCount / TOTAL_FRAMES) * 100));
    if (loaderPercent) loaderPercent.textContent = `${percent}%`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    // Hide loader once 30 frames are cached (smooth scrub ready)
    if (loadedCount >= 30 && loaderOverlay && !loaderOverlay.classList.contains('is-hidden')) {
      setTimeout(() => {
        loaderOverlay.classList.add('is-hidden');
      }, 300);
    }

    if (loadedCount >= TOTAL_FRAMES && loaderOverlay) {
      loaderOverlay.classList.add('is-hidden');
    }
  }

  /**
   * Main LERP Animation Loop running on RAF (60/120fps)
   */
  function tick() {
    const diff = targetProgress - currentProgress;

    if (Math.abs(diff) > 0.0001) {
      currentProgress += diff * LERP_DAMPING;
      renderCurrentState();
    } else if (currentProgress !== targetProgress) {
      currentProgress = targetProgress;
      renderCurrentState();
    }

    requestAnimationFrame(tick);
  }

  /**
   * Unified Interactive Toast Notification System
   */
  const featureToast = document.getElementById('featureToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastTitle = document.getElementById('toastTitle');
  const toastDesc = document.getElementById('toastDesc');
  let toastTimeout = null;

  function showToast(icon, title, desc) {
    if (!featureToast) return;
    if (toastTimeout) clearTimeout(toastTimeout);

    if (toastIcon) toastIcon.textContent = icon;
    if (toastTitle) toastTitle.textContent = title;
    if (toastDesc) toastDesc.textContent = desc;

    featureToast.classList.add('show');
    toastTimeout = setTimeout(() => {
      featureToast.classList.remove('show');
    }, 3500);
  }

  /**
   * AI Projects Category Filter
   */
  function initProjectFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const projectCards = document.querySelectorAll('.project-card');

    if (!filterTabs.length || !projectCards.length) return;

    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');

        projectCards.forEach((card) => {
          const category = card.getAttribute('data-category');
          if (filter === 'all' || category === filter) {
            card.classList.remove('is-hidden');
            card.style.opacity = '0';
            card.style.transform = 'translateY(12px)';
            requestAnimationFrame(() => {
              card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            });
          } else {
            card.classList.add('is-hidden');
          }
        });
      });
    });
  }

  /**
   * Separate Dual Studio Showcase (9:16 Vertical Reel & 16:9 Full Visibility)
   * - Aspect ratio switcher (9:16 vs 16:9) with zero crop
   * - Interactive project switcher (Commercial Skincare vs Character Animation)
   * - In-video controls: Play/Pause, Mute/Unmute, Timeline Scrubber
   */
  function initVideoStudioShowcase() {
    const stage = document.getElementById('studioDualStage');
    const staticImg = document.getElementById('studioStaticImg');
    const videoEl = document.getElementById('studioVideoEl');
    if (!stage || !staticImg || !videoEl) return;

    // Controls
    const ratioBtns = document.querySelectorAll('.ratio-btn');
    const projectBtns = document.querySelectorAll('.project-switch-btn');
    const vidPlayToggle = document.getElementById('vidPlayToggle');
    const vidPlayIcon = document.getElementById('vidPlayIcon');
    const vidMuteToggle = document.getElementById('vidMuteToggle');
    const vidMuteIcon = document.getElementById('vidMuteIcon');
    const vidProgressTrack = document.getElementById('vidProgressTrack');
    const vidProgressFill = document.getElementById('vidProgressFill');

    const staticMetaTitle = document.getElementById('staticMetaTitle');
    const staticMetaSub = document.getElementById('staticMetaSub');
    const videoMetaTitle = document.getElementById('videoMetaTitle');
    const videoMetaSub = document.getElementById('videoMetaSub');

    let currentRatio = '9-16';
    let currentProject = 'commercial';

    const projectData = {
      commercial: {
        img916: 'assets/products/revitalize-overnight-916.jpg',
        img169: 'assets/products/revitalize-overnight.jpg',
        video: 'assets/videos/product-commercial.mp4',
        staticTitle: 'Revitalize Overnight • Initial Prompt',
        staticSub: 'Prompt: Frosted glass jar, brushed gunmetal lid, soft botanical backdrop, 8k',
        videoTitle: 'Cinematic Commercial • Fluid Motion',
        videoSub: 'Veo & Flow AI motion synthesis • Zero crop full visibility'
      },
      character: {
        img916: 'assets/jewellery/jewellery-editorial-model.jpg',
        img169: 'assets/fashion/penthouse-editorial.jpg',
        video: 'assets/videos/character-animation.mp4',
        staticTitle: 'Character Editorial • High Fashion Still',
        staticSub: 'Prompt: High-fashion commercial portrait, emerald velvet gown, studio lighting, 8k',
        videoTitle: 'Character Performance • Dynamic Motion',
        videoSub: 'Micro-expressions, realistic eye movement & cinematic lighting transition'
      }
    };

    function updateMediaDisplay() {
      const data = projectData[currentProject];
      if (currentRatio === '9-16') {
        stage.classList.remove('ratio-16-9');
        stage.classList.add('ratio-9-16');
        staticImg.src = data.img916;
      } else {
        stage.classList.remove('ratio-9-16');
        stage.classList.add('ratio-16-9');
        staticImg.src = data.img169;
      }

      if (videoEl.src.indexOf(data.video) === -1) {
        videoEl.src = data.video;
        videoEl.load();
        videoEl.play().catch(() => {});
      }

      if (staticMetaTitle) staticMetaTitle.textContent = data.staticTitle;
      if (staticMetaSub) staticMetaSub.textContent = data.staticSub;
      if (videoMetaTitle) videoMetaTitle.textContent = data.videoTitle;
      if (videoMetaSub) videoMetaSub.textContent = data.videoSub;
    }

    // Ratio Switchers
    ratioBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        ratioBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentRatio = btn.getAttribute('data-ratio');
        updateMediaDisplay();
        if (currentRatio === '9-16') {
          showToast('📱', '9:16 VERTICAL REEL MODE', 'Zero-crop vertical reel ratio for smartphone screens.');
        } else {
          showToast('🎬', '16:9 WIDESCREEN MODE', 'Zero-crop full cinematic widescreen presentation.');
        }
      });
    });

    // Project Switchers
    projectBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        projectBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentProject = btn.getAttribute('data-project');
        updateMediaDisplay();
        showToast('✨', 'PROJECT LOADED', `Switched to ${projectData[currentProject].staticTitle}`);
      });
    });

    // Video Play/Pause Toggle
    if (vidPlayToggle && vidPlayIcon) {
      vidPlayToggle.addEventListener('click', () => {
        if (videoEl.paused) {
          videoEl.play();
          vidPlayIcon.textContent = '❚❚';
        } else {
          videoEl.pause();
          vidPlayIcon.textContent = '▶';
        }
      });
    }

    // Video Mute/Unmute Toggle
    if (vidMuteToggle && vidMuteIcon) {
      vidMuteToggle.addEventListener('click', () => {
        videoEl.muted = !videoEl.muted;
        vidMuteIcon.textContent = videoEl.muted ? '🔇' : '🔊';
        showToast(videoEl.muted ? '🔇' : '🔊', 'AUDIO TOGGLED', videoEl.muted ? 'Video audio muted' : 'Video audio active');
      });
    }

    // Video Timeline Progress
    if (vidProgressTrack && vidProgressFill) {
      videoEl.addEventListener('timeupdate', () => {
        if (!isNaN(videoEl.duration) && videoEl.duration > 0) {
          const progress = (videoEl.currentTime / videoEl.duration) * 100;
          vidProgressFill.style.width = progress + '%';
        }
      });

      vidProgressTrack.addEventListener('click', (e) => {
        const rect = vidProgressTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        if (!isNaN(videoEl.duration)) {
          videoEl.currentTime = pct * videoEl.duration;
        }
      });
    }
  }

  /**
   * Top Navigation: Sticky Blur, Mobile Drawer, and Active Section Scroll-Spy
   */
  function initNavigation() {
    const topNavbar = document.querySelector('.top-navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-menu .nav-link');

    // Mobile Toggle with ARIA state & outside-click dismissal
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navMenu.classList.toggle('is-open');
        navToggle.classList.toggle('is-active', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
          navMenu.classList.remove('is-open');
          navToggle.classList.remove('is-active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Close mobile menu on nav link click
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (navMenu) navMenu.classList.remove('is-open');
        if (navToggle) {
          navToggle.classList.remove('is-active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Sections for Scroll Spy
    const sectionIds = ['home', 'about', 'ai-projects', 'social-media', 'ai-video', 'skills', 'contact'];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    function updateActiveNav() {
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop || 0;

      // Scrolled navbar style
      if (topNavbar) {
        if (scrollPos > 30) {
          topNavbar.classList.add('is-scrolled');
        } else {
          topNavbar.classList.remove('is-scrolled');
        }
      }

      // Detect current section
      let currentId = 'home';
      const threshold = window.innerHeight * 0.35;

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        const rect = sec.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom >= threshold) {
          currentId = sec.id;
          break;
        } else if (rect.top <= threshold) {
          currentId = sec.id;
        }
      }

      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  /**
   * Smooth Anchor Scrolling with 70px Sticky Header Clearance
   */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const navOffset = 70;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Interactive Footer Features: Live IST Clock, 1-Click Copy, Back to Top, Magnetic CTA
   */
  function initFooterFeatures() {
    // 1. Live Indian Standard Time (IST) Digital Clock
    const clockEl = document.getElementById('footerLiveTime');
    function updateClock() {
      if (!clockEl) return;
      const now = new Date();
      const options = {
        timeZone: 'Asia/Kolkata',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      clockEl.textContent = now.toLocaleTimeString('en-US', options) + ' IST';
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Interactive Click-to-Copy Email Action
    const copyBox = document.getElementById('copyEmailBox');
    const copyTooltip = document.getElementById('copyTooltip');
    const targetEmail = document.getElementById('targetEmailText');
    if (copyBox && copyTooltip && targetEmail) {
      copyBox.addEventListener('click', () => {
        const email = targetEmail.textContent.trim();
        navigator.clipboard.writeText(email).then(() => {
          copyTooltip.textContent = 'Copied to Clipboard! 🚀';
          copyTooltip.classList.add('copied');
          setTimeout(() => {
            copyTooltip.textContent = 'Click to Copy';
            copyTooltip.classList.remove('copied');
          }, 2500);
        }).catch(() => {
          copyTooltip.textContent = 'Press Ctrl+C to copy';
        });
      });
    }

    // 3. Smooth "Back to Top" Button
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 4. Subtle Magnetic Cursor Hover for CTA Button
    const magneticBtn = document.getElementById('magneticCta');
    if (magneticBtn) {
      magneticBtn.addEventListener('mousemove', (e) => {
        const rect = magneticBtn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        magneticBtn.style.transform = `translate(${x * 0.18}px, ${y * 0.18 - 4}px) scale(1.02)`;
      });
      magneticBtn.addEventListener('mouseleave', () => {
        magneticBtn.style.transform = '';
      });
    }
  }

  /**
   * Hero AI Specialization Badges (Interactive Buttons with RGB Light & Custom Actions)
   */
  function initHeroFeatureBadges() {
    const badges = document.querySelectorAll('.feature-badge');

    badges.forEach((badge) => {
      badge.addEventListener('click', (e) => {
        e.preventDefault();

        // 1. Manage Active / Selected RGB State
        badges.forEach((b) => b.classList.remove('is-selected'));
        badge.classList.add('is-selected');

        const action = badge.getAttribute('data-action');

        switch (action) {
          case 'prompt-engineering': {
            // Smooth scroll to Skills & Tools section
            const skillsSec = document.getElementById('skills');
            if (skillsSec) {
              const topOffset = skillsSec.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            // Temporarily highlight prompt architecture cards
            const promptChips = document.querySelectorAll('.prompt-chip');
            promptChips.forEach((chip) => {
              chip.style.borderColor = 'rgba(0, 240, 255, 0.8)';
              chip.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.4)';
              setTimeout(() => {
                chip.style.borderColor = '';
                chip.style.boxShadow = '';
              }, 2200);
            });
            showToast('⚡', 'PROMPT ENGINEERING', 'Token weighting, seed preservation & latent space steering.');
            break;
          }

          case 'photorealistic-visuals': {
            // Activate 'all' filter and scroll to AI Projects
            const allFilterBtn = document.querySelector('.filter-tab[data-filter="all"]');
            if (allFilterBtn) {
              allFilterBtn.click();
            }
            const projectsSec = document.getElementById('ai-projects');
            if (projectsSec) {
              const topOffset = projectsSec.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            showToast('📸', 'PHOTOREALISTIC AI VISUALS', 'Curated gallery of 8K macro caustics, fine jewellery & luxury products.');
            break;
          }

          case 'ai-video': {
            // Smooth scroll to AI Video & Motion section
            const videoSec = document.getElementById('ai-video');
            if (videoSec) {
              const topOffset = videoSec.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            // Pulse the Video Studio Showcase container
            const studioShowcase = document.getElementById('videoStudioShowcase');
            if (studioShowcase) {
              studioShowcase.classList.add('pulse-highlight');
              setTimeout(() => studioShowcase.classList.remove('pulse-highlight'), 1800);
            }
            showToast('🎬', 'AI VIDEO & MOTION', 'Interactive 60 FPS generative commercial image-to-video pipeline.');
            break;
          }

          case 'commercial-advertising': {
            // Activate 'advertising' filter tab and scroll to AI Projects
            const adFilterBtn = document.querySelector('.filter-tab[data-filter="advertising"]');
            if (adFilterBtn) {
              adFilterBtn.click();
            }
            const projectsSec = document.getElementById('ai-projects');
            if (projectsSec) {
              const topOffset = projectsSec.getBoundingClientRect().top + window.pageYOffset - 80;
              window.scrollTo({ top: topOffset, behavior: 'smooth' });
            }
            showToast('📢', 'COMMERCIAL ADVERTISING', 'High-converting FMCG retail campaigns & billboard creative concepts.');
            break;
          }
        }
      });
    });
  }

  /**
   * Interactive 3D Reel Triad Phone Showcase
   * - Like button toggling with count increment/decrement
   * - Play button animation with contextual toast previews
   * - Focus bring-to-front on mobile or desktop click
   */
  function initReelShowcaseInteractions() {
    const stage = document.querySelector('.reels-showcase-stage');
    if (!stage) return;

    // Like buttons
    const likeButtons = stage.querySelectorAll('.like-btn');
    likeButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isLiked = btn.classList.toggle('is-liked');
        const countLabel = btn.closest('.rail-action-item')?.querySelector('.action-label');
        if (countLabel) {
          let currentStr = countLabel.textContent.trim();
          let num = parseFloat(currentStr.replace('K', ''));
          if (!isNaN(num)) {
            let updated = isLiked ? (num + 0.1) : (num - 0.1);
            countLabel.textContent = `${updated.toFixed(1)}K`;
          }
        }
        btn.style.transform = 'scale(1.35)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 220);
      });
    });

    // Share & Comment buttons
    const shareButtons = stage.querySelectorAll('.share-btn');
    shareButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast('🔗', 'LINK COPIED', 'Reel link copied to clipboard for sharing!');
      });
    });

    const commentButtons = stage.querySelectorAll('.comment-btn');
    commentButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showToast('💬', 'CREATOR REEL COMMENTS', 'Community discussion & prompt breakdown feedback active.');
      });
    });

    // Play pulse buttons
    const playButtons = stage.querySelectorAll('.play-pulse-icon');
    playButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wrapper = btn.closest('.reel-perspective-wrapper');
        const phoneIdx = wrapper?.getAttribute('data-phone-index');

        btn.style.transform = 'scale(0.88)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 200);

        if (phoneIdx === '1') {
          showToast('⏱️', 'AUNCHTER HOROLOGY REEL', 'Playing 60s macro titanium lighting & gear train breakdown.');
        } else if (phoneIdx === '2') {
          showToast('🌊', 'NC ISPE PERFUME REEL', 'Playing 4K Veo commercial fluid & glass caustics simulation.');
        } else if (phoneIdx === '3') {
          showToast('👑', 'ROYAL BLUE BRIDAL REEL', 'Playing Rajputana royal jewellery & zardozi embroidery reel.');
        }
      });
    });
  }

  // Event Listeners (Passive for high 60fps/120fps touch scroll performance)
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('scroll', handleScroll, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 200);
  }, { passive: true });

  // System Initialization
  resizeCanvas();
  handleScroll();
  initPreloader();
  initProjectFilters();
  initVideoStudioShowcase();
  initNavigation();
  initSmoothAnchors();
  initFooterFeatures();
  initHeroFeatureBadges();
  initReelShowcaseInteractions();
  requestAnimationFrame(tick);
})();
