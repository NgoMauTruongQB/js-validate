
// đối tượng 'Validator'
function Validator(options){

    function getParent(element, selector) {
        while (element.parentElement) {
            if(element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }

    var selectorRules = {}

    // hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
        var errorMessage

        // lấy ra các rules của selector
        var rules = selectorRules[rule.selector]

        // lặp qua từng rule & kiểm tra
        // nếu có lỗi thì dừng việc kiểm tra
        for(var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                     errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                     )
                    break
                default:
                    errorMessage = rules[i](inputElement.value)
                    break
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

    // lấy element của form
    var formElement = document.querySelector(options.form)
    if(formElement){

        formElement.onsubmit = (e) => {
            e.preventDefault()

            var isFormValid = true

            // thực hiện lặp qua từng rule và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector)
                var isValid = validate(inputElement, rule)
                if(!isValid){
                    isFormValid = false
                }
            })

            if (isFormValid) {
                // trường hợp submit với js
                if(typeof options.onSubmit === 'function') {

                    var enableInputs = formElement.querySelectorAll('[name]')

                    var formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = ''
                                    return values
                                }

                                if(!Array.isArray(values[input.name])){
                                    values[input.name] = []
                                }

                                values[input.name].push(input.value)

                                break;
                            case 'file':
                                values[input.name] = input.files
                                break;
                            default:
                                values[input.name] = input.value
                                break;
                        }
                        return values
                    }, {})

                    options.onSubmit(formValues)
                } 
                // trường hợp submit với hành vi mặcc định
                else {
                    formElement.submit()
                }
            }
        }

        // xử lí lặp qua mỗi rule và sử lí lắng nghe sự kiện
        options.rules.forEach(rule => {

            // Lưu lại các rules cho mỗi input
            if ( Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test)
            } else {
                selectorRules[rule.selector] = [rule.test]      
            }

            var inputElements = formElement.querySelectorAll(rule.selector)

            Array.from(inputElements).forEach(inputElement => {
                var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector)
                // xử lí khi blur khỏi input
                inputElement.onblur = () => {
                    validate(inputElement, rule)
                }

                // xử lí khi người dùng nhập vào input
                inputElement.oninput = () => {
                    errorElement.innerText = ''
                    getParent(inputElement, options.formGroupSelector).classList.remove('invalid')
                }

            })
        });
    }
}

// định nghĩa các rules
// Nguyên tắc của các rules
// 1. Khi có lỗi trả ra message lỗi
/// 2. Khi hợp lệ không trả ra gì cả
Validator.isRequired = selector => {
    return {
        selector: selector,
        test: value => {
            return value ? undefined : 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = selector => {
    return {
        selector: selector,
        test: value => {
            var regex = /^([A-Za-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/
            return regex.test(value) ? undefined : 'Không đúng định dạng email'
        }
    }
}

Validator.minLength = (selector, min) => {
    return {
        selector: selector,
        test: value => {
            return value.trim().length >= min ? undefined : `Nhập tối thiểu ${min} kí tự và không chứ khoảng trắng`
        }
    }
}

Validator.isConfirmed = (selector, getConfirmValue, message) => {
    return {
        selector: selector,
        test: value => {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác'
        }
    }
}