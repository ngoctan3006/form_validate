function Validator(formSelector) {
    const _this = this
    function getParent(element, selector) {
        while(element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }
    const formElement = document.querySelector(formSelector)
    const formRules = {}
    const validatorRules = {
        required: value => {
            if(typeof value === 'string') {
                return value.trim() ? undefined : 'Vui lòng nhập vào ô này'
            }
            return value ? undefined : 'Vui lòng nhập vào ô này'
        },
        email: value => {
            const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
            return regex.test(value) ? undefined : 'Bạn phải nhập một email'
        },
        min: min => (
            value => (
                value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} ký tự`
            )
        ),
        max: max => (
            value => (
                value.length <= max ? undefined : `Chỉ được nhập tối đa ${max} ký tự`
            )
        )
    }
    if(formElement) {
        const inputs = formElement.querySelectorAll('[name][rules]')
        if(inputs) {
            for(let input of inputs) {
                const rules = input.getAttribute('rules').split('|')
                for(let rule of rules) {
                    const isRuleHasValue = rule.includes(':')
                    let ruleInfo
                    if(isRuleHasValue) {
                        ruleInfo = rule.split(':')
                        rule = ruleInfo[0]
                    }
                    let ruleFunc = validatorRules[rule]
                    if(isRuleHasValue) {
                        ruleFunc = ruleFunc(ruleInfo[1])
                    }
                    if(Array.isArray(formRules[input.name])) {
                        formRules[input.name].push(ruleFunc)
                    } else {
                        formRules[input.name] = [ruleFunc]
                    }
                }

                // Lắng nghe sự kiện để validate
                input.onblur = handleValidate
                input.oninput = handleClearError
            }
            // Hàm thực hiện validate
            function handleValidate(e) {
                const rules = formRules[e.target.name]
                let errorMessage
                for(let rule of rules) {
                    errorMessage = rule(e.target.value)
                    if(errorMessage) break
                }
                if(errorMessage) {
                    const formGroup = getParent(e.target, '.form-group')
                    if(formGroup) {
                        formGroup.classList.add('invalid')
                        const formMessage = formGroup.querySelector('.form-message')
                        if(formMessage) {
                            formMessage.innerText = errorMessage
                        }
                    }
                }
                return !errorMessage
            }
            function handleClearError(e) {
                const formGroup = getParent(e.target, '.form-group')
                if(formGroup.classList.contains('invalid')) {
                    formGroup.classList.remove('invalid')
                    const formMessage = formGroup.querySelector('.form-message')
                    if(formMessage) {
                        formMessage.innerText = ''
                    }
                }
            }
        }
    }
    // Xử lí submit form
    formElement.onsubmit = e => {
        e.preventDefault()
        const inputs = formElement.querySelectorAll('[name][rules]')
        let isValid = true
        if(inputs) {
            for(let input of inputs) {
                if(!handleValidate({target: input})) {
                    isValid = false
                }
            }
        }
        if(isValid) {
            if(typeof _this.onSubmit === 'function') {
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
                _this.onSubmit(formValues)
            } else {
                formElement.submit()
            }
        }
    }
}