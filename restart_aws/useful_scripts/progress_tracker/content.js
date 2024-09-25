(function () {
    'use strict';

    // Function to create the floating window
    function createFloatingWindow () {
        let container = document.createElement('div');
        container.id = 'highlighter-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            transition: all 0.3s ease;
            font-family: 'Arial', sans-serif;
            max-width: 350px;
            width: 100%;
        `;
        document.body.appendChild(container);

        let header = document.createElement('div');
        header.style.cssText = `
            padding: 15px 20px;
            background-color: #232f3e;
            color: #ffffff;
            cursor: pointer;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
            font-weight: bold;
            font-size: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = 'AWS Restart Progress Tracker <span id="toggle-icon">▼</span>';
        container.appendChild(header);

        let content = document.createElement('div');
        content.id = 'highlighter-content';
        content.style.cssText = `
            padding: 15px;
            max-height: 500px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
        `;
        container.appendChild(content);

        // Toggle container visibility on header click
        header.addEventListener('click', () => {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                container.style.height = 'auto';
                document.getElementById('toggle-icon').textContent = '▼';
            } else {
                content.style.display = 'none';
                container.style.height = header.offsetHeight + 'px';
                document.getElementById('toggle-icon').textContent = '▲';
            }
        });

        return content;
    }

    // Retrieve saved state from localStorage
    function getSavedState () {
        let savedState = localStorage.getItem('highlightedElements');
        return savedState ? JSON.parse(savedState) : {};
    }

    // Save state to localStorage
    function saveState (state) {
        localStorage.setItem('highlightedElements', JSON.stringify(state));
    }

    // Get saved state
    let highlightedElements = getSavedState();

    // Create the floating window container
    let container = createFloatingWindow();

    // Find all elements with the class ".name.ellipsis"
    document.querySelectorAll(".name.ellipsis").forEach((element, index) => {
        let parentElem = element.parentElement.parentElement;

        // Create a dropdown container
        let dropdownContainer = document.createElement('div');
        dropdownContainer.style.cssText = `
            margin-bottom: 15px;
            border-bottom: 1px solid #e0e0e0;
            padding-bottom: 10px;
        `;
        let dropdownLabel = document.createElement('div');
        dropdownLabel.style.cssText = `
            cursor: pointer;
            font-weight: bold;
            padding: 10px;
            background-color: #f0f0f0;
            border-radius: 5px;
            display: flex;
            align-items: center;
            transition: background-color 0.3s ease;
        `;
        dropdownLabel.innerHTML = `<span style="margin-right: 10px;">▶</span>${ element.textContent }`;

        let dropdownContent = document.createElement('div');
        dropdownContent.style.cssText = `
            display: none;
            padding-left: 20px;
            margin-top: 10px;
        `;

        // Toggle dropdown on label click
        dropdownLabel.addEventListener('click', () => {
            dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
            dropdownLabel.querySelector('span').textContent = dropdownContent.style.display === 'none' ? '▶' : '▼';
            dropdownLabel.style.backgroundColor = dropdownContent.style.display === 'none' ? '#f0f0f0' : '#e0e0e0';
        });

        // Append label and content to dropdown container
        dropdownContainer.appendChild(dropdownLabel);
        dropdownContainer.appendChild(dropdownContent);

        // Check if this element is in the saved state
        if (highlightedElements[index]) {
            parentElem.style.backgroundColor = 'rgba(255, 153, 0, 0.2)';
        }

        // Create the main checkbox for the parent element
        let parentCheckbox = document.createElement('input');
        parentCheckbox.type = 'checkbox';
        parentCheckbox.checked = highlightedElements[index] || false;
        parentCheckbox.style.marginRight = '10px';

        parentCheckbox.addEventListener('change', () => {
            if (parentCheckbox.checked) {
                parentElem.style.backgroundColor = 'rgba(255, 153, 0, 0.2)';
                highlightedElements[index] = true;
            } else {
                parentElem.style.backgroundColor = '';
                delete highlightedElements[index];
            }

            // Save updated state
            saveState(highlightedElements);
        });

        // Append the parent checkbox to the dropdown label
        dropdownLabel.prepend(parentCheckbox);

        // Extract child elements and create checkboxes for each child
        let childIndex = 0;
        element.parentElement.parentElement.parentElement.childNodes[5]?.childNodes[1]?.childNodes.forEach((childElement) => {
            try {
                let childText = childElement.childNodes[1].childNodes[3].innerText;
                let childElemId = `${ index }-${ childIndex }`;

                // Create child checkbox and label
                let childContainer = document.createElement('div');
                childContainer.style.cssText = `
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                `;
                let childCheckbox = document.createElement('input');
                childCheckbox.type = 'checkbox';
                childCheckbox.checked = highlightedElements[childElemId] || false;
                childCheckbox.style.marginRight = '8px';
                let childLabel = document.createElement('label');
                childLabel.textContent = childText;
                childLabel.style.cssText = `
                    font-size: 0.9em;
                    color: #333;
                `;

                // Check if this child element is in the saved state
                if (highlightedElements[childElemId]) {
                    childElement.childNodes[1].childNodes[3].style.backgroundColor = 'rgba(0, 176, 255, 0.2)';
                }

                // Handle checkbox change event for child
                childCheckbox.addEventListener('change', () => {
                    if (childCheckbox.checked) {
                        childElement.childNodes[1].childNodes[3].style.backgroundColor = 'rgba(0, 176, 255, 0.2)';
                        highlightedElements[childElemId] = true;
                    } else {
                        childElement.childNodes[1].childNodes[3].style.backgroundColor = '';
                        delete highlightedElements[childElemId];
                    }

                    // Save updated state
                    saveState(highlightedElements);
                });

                // Append checkbox and label to child container
                childContainer.appendChild(childCheckbox);
                childContainer.appendChild(childLabel);

                // Add child container to the dropdown content
                dropdownContent.appendChild(childContainer);

                // Increment child index
                childIndex++;
            } catch (error) {
                console.error("Error processing child element:", error);
            }
        });

        // Add dropdown container to the main floating window
        container.appendChild(dropdownContainer);
    });

    // Add custom scrollbar styles
    let style = document.createElement('style');
    style.textContent = `
        #highlighter-content::-webkit-scrollbar {
            width: 8px;
        }
        #highlighter-content::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        #highlighter-content::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
        }
        #highlighter-content::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    `;
    document.head.appendChild(style);
})();