document.addEventListener('DOMContentLoaded', function() {
    {% if messages %}
      {% for message in messages %}
        Toastify({
          text: "{{ message }}",
          duration: 3000,
          close: true,
          gravity: "top",
          position: "center",
          stopOnFocus: true,
       
        }).showToast();
      {% endfor %}
    {% endif %}
  });