// Đối tượng Validator
function Validator(options) {
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector))
                return element.parentElement
            element = element.parentElement
        }
    }

    const selectorRules = {}

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
        let errorMessage

        // Lấy ra các rule của selector
        const rules = selectorRules[rule.selector]
        // Lặp qua các rule và check
        for(let r of rules) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = r(
                        formElement.querySelector(rule.selector + ':checked')
                    )
                    break
                default:
                    errorMessage = r(inputElement.value)
            }
            if(errorMessage) break
        }
        if(errorMessage) {
            errorElement.innerText = errorMessage
            getParent(inputElement, options.formGroupSelector).classList.add('invalid')
        } else {
            errorElement.innerText = ''
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
        }
        return !errorMessage
    }

    // Lấy element của form cần validate
    const formElement = document.querySelector(options.form)
    if(formElement) {
        // Khi submit form
        formElement.onsubmit = e => {
            e.preventDefault()
            let isFormValid = true
            // Thực hiện lặp qua từng rule và validate
            options.rules.forEach(rule => {
                const inputElement = formElement.querySelector(rule.selector)
                let isValid = validate(inputElement, rule)
                if(!isValid) isFormValid = false
            })
            if(isFormValid) {
                if(typeof options.onSubmit === 'function') {
                    const enableInputs = formElement.querySelectorAll('[name]')
                    const formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = ''
                                    return values;
                                }
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = []
                                }
                                values[input.name].push(input.value)
                                break
                            case 'file':
                                values[input.name] = input.files
                                break
                            default:
                                values[input.name] = input.value
                        }
                        return values
                    }, {})
                    options.onSubmit(formValues)
                }
            }
        }
        // Lặp qua mỗi rule và xử lí (lắng nghe input, blur, ...)
        options.rules.forEach(rule => {
            // Lưu lại các rule cho mỗi input
            if(Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]
            }
            const inputElements = formElement.querySelectorAll(rule.selector)
            Array.from(inputElements).forEach(inputElement => {
                if(inputElement) {
                    // Xử lý khi blur
                    inputElement.onblur = () => {
                        validate(inputElement, rule)
                    }
        
                    // Xử lý khi nhập
                    inputElement.oninput = () => {
                        const errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                        errorElement.innerText = ''
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                    }
                }
            })
        })
    }
}

// Định nghĩa rule
Validator.isRequired = (selector, message) => ({
    selector,
    test: value => {
        if(typeof value === 'string')
            return value.trim() ? undefined : message || 'Vui lòng nhập vào ô này'
        return value ? undefined : message || 'Vui lòng nhập vào ô này'
    }
})
Validator.isEmail = (selector, message) => ({
    selector,
    test: value => {
        const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        return regex.test(value) ? undefined : message || 'Bạn phải nhập một email'
    }
})
Validator.minLength = (selector, min, message) => ({
    selector,
    test: value => value.length >= min ? undefined : message || `Mật khẩu phải có tối thiểu ${min} ký tự`
})
Validator.isConfirmed = (selector, getConfirmValue, message) => ({
    selector,
    test: value => value === getConfirmValue() ? undefined : message || 'Mật khẩu bạn nhập không trùng nhau'
})