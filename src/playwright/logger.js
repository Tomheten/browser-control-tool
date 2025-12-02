const networkTypes = [
  'All', 'Document', 'Stylesheet', 'Image', 'Media', 'Font',
  'Script', 'XHR', 'Fetch', 'WebSocket', 'Manifest', 'Other', 'Wasm'
];

const selectedOptions = new Set();
const selectedOptionsContainer = document.getElementById('selected-options');

function updateSelectedOptions() {
  selectedOptionsContainer.innerHTML = '';
  networkTypes.forEach(type => {
    const option = document.createElement('div');
    option.className = 'option-item' + (selectedOptions.has(type) ? ' selected' : '');
    option.innerHTML = `
      ${type}
      <span class="remove-option" onclick="removeOption('${type}')">✕</span>
    `;
    option.addEventListener('click', () => toggleOption(type));
    selectedOptionsContainer.appendChild(option);
  });
}

function toggleOption(type) {
  if (selectedOptions.has(type)) {
    selectedOptions.delete(type);
  } else {
    selectedOptions.add(type);
  }
  updateSelectedOptions();
}

function removeOption(type) {
  selectedOptions.delete(type);
  updateSelectedOptions();
}

function resetSelection() {
  selectedOptions.clear();
  updateSelectedOptions();
}

document.getElementById('network-log-btn').addEventListener('click', () => {
  const fileName = document.getElementById('log-file').value || 'network-cdp.log';
  const types = Array.from(selectedOptions);

  if (types.length === 0) {
    alert('Please select at least one network type.');
    return;
  }

  types.forEach(type => {
    console.dirxml('network_log', type, fileName);
  });
});

document.getElementById('reset-btn').addEventListener('click', resetSelection);

updateSelectedOptions();