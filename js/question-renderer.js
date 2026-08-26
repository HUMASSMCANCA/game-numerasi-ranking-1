/* ============================================================
   Question Renderer Helper
   Game Numerasi Ranking 1
   
   Helper untuk render soal dengan gambar dan equation
   ============================================================ */

const QuestionRenderer = {
  
  // Render question dengan support gambar dan MathJax
  renderQuestion(question, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Render question image if exists
    if (question.question_image) {
      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = 'margin-bottom:20px;text-align:center;';
      
      const img = document.createElement('img');
      img.src = question.question_image;
      img.alt = 'Question image';
      img.style.cssText = 'max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
      
      imgContainer.appendChild(img);
      container.appendChild(imgContainer);
    }

    // Render question text
    const textDiv = document.createElement('div');
    textDiv.innerHTML = question.question_text || '';
    textDiv.style.cssText = 'font-size:1.5rem;font-weight:600;line-height:1.6;color:var(--text-primary);';
    container.appendChild(textDiv);

    // Typeset with MathJax if available
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([container]).catch((err) => console.log('MathJax error:', err));
    }
  },

  // Update question image in specific element
  updateQuestionImage(question, imageElementId) {
    const imgElement = document.getElementById(imageElementId);
    const imgContainer = document.getElementById(imageElementId + '-container');
    
    if (!imgElement || !imgContainer) return;

    if (question.question_image) {
      imgElement.src = question.question_image;
      imgContainer.style.display = 'block';
    } else {
      imgContainer.style.display = 'none';
    }
  },

  // Update question text with MathJax rendering
  updateQuestionText(question, textElementId) {
    const textElement = document.getElementById(textElementId);
    if (!textElement) return;

    textElement.innerHTML = question.question_text || '';

    // Typeset with MathJax if available
    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([textElement]).catch((err) => console.log('MathJax error:', err));
    }
  }
};
