function Validator(formSelector, options) {
    // gán giá trị mặc định cho tham số
    if(!options) {
        options = {}
    }

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement
        }
    }

    var formRules = {}

    var validatorRules = {
        required: (value) => {
            return value ? undefined : 'Vui lòng nhập trường này';
        },
        email: value => {
            var regex = /^([A-Za-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
            return regex.test(value) ? undefined : 'Không đúng định dạng email'
        },
        min: (min) => {
            return (value) => {
                return value.trim().length >= min ? undefined : `Nhập tối thiểu ${min} kí tự và không chứ khoảng trắng`
            }
        },
        max: (max) => {
            return (value) => {
                return value.length <= max ? undefined : `Chỉ cho phép nhập tối đa ${max} kí tự`
            }
        }
    }

    // Lấy ra form element trong DOM theo 'formSelector'
    var formElement = document.querySelector(formSelector)
    
    if(formElement) {
        var inputs = formElement.querySelectorAll('[name][rules]')
        for(var input of inputs) {
            var rules = input.getAttribute('rules').split('|')
            for(var rule of rules) {
                var ruleInfo
                var isRuleHasValue = rule.includes(':')

                if(isRuleHasValue) {
                    ruleInfo = rule.split(":")
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]

                if(isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if(rule.includes(':')) {}
                
                if(Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {
                    formRules[input.name] = [ruleFunc]
                }
            }

            //Lắng nghe sự kiện để validate
            input.onblur = handleValidate
            input.oninput = handleClearError

        }

        // Hàm thực hiện validate
        function handleValidate(e) {
            var rules = formRules[e.target.name]
            var errorMessage
            for (var rule of rules) {
                switch (e.target.type) {
                    case 'checkbox':
                    case 'radio':
                        errorMessage = rule(e.target.checked);
                        break
                    default:
                        errorMessage = rule(e.target.value)
                }
                if (errorMessage) break

            }

            // Send error message when error is found
            if (errorMessage) {
                var formGroup = getParent(e.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')
                    var formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage
                    }
                }
            }

            return errorMessage
        }

        // hàm clear message lỗi
        function handleClearError(e) {
            var formGroup = getParent(e.target, '.form-group')
            if(formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')
                var formMessage = formGroup.querySelector('.form-message')
                if(formMessage) {
                    formMessage.innerText = ''
                }
            }
        }
        
    }

    // Xử lí hành vi submit form 
    formElement.onsubmit = (e) => {
        e.preventDefault()

        e.preventDefault()
        var isValid = true
        var inputs = formElement.querySelectorAll('[name][rules]')
        for (var [index, input] of inputs.entries()) {

            if (input.type === 'checkbox' || input.type === 'radio') {
                
                if (index > 0 && isValid === true && input.name === inputs[--index].name) {
                    continue
                }
                if (!handleValidate({ target: input })) {
                    isValid = true
                    handleClearError({ target: input })
                }
            }
            
            if (handleValidate({ target: input })) {
                isValid = false
            }
        }

        // Khi không có lỗi thì submit form 
        if(isValid) {
            if(options.onSubmit) {
                if(typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]')

                    var formValues = Array.from(enableInputs).reduce(function (values, input) {
                        switch (input.type) {
                            case 'checkbox':
                                if (!Array.isArray(values[input.name])) values[input.name] = []
                                if (input.matches(':checked')) values[input.name].push(input.value)
                                break
                            case 'radio':
                                if (input.matches(':checked')) values[input.name] = input.value
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
                } else {
                    formElement.submit()
                }
            }
        }
    }
}