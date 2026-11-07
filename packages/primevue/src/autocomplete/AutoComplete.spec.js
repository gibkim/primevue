import { mount } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import { nextTick } from 'vue';
import AutoComplete from './AutoComplete.vue';

describe('AutoComplete.vue', () => {
    let wrapper;

    beforeEach(async () => {
        wrapper = mount(AutoComplete, {
            global: {
                plugins: [PrimeVue],
                stubs: {
                    teleport: true
                }
            },
            props: {
                suggestions: null,
                field: 'name'
            },
            data() {
                return {
                    countries: [
                        { name: 'Afghanistan', code: 'AF' },
                        { name: 'Bahrain', code: 'BH' },
                        { name: 'Chile', code: 'CL' },
                        { name: 'Denmark', code: 'DK' }
                    ]
                };
            }
        });

        await wrapper.trigger('click');
    });

    afterEach(() => {
        wrapper.unmount();
    });

    it('should exists', () => {
        expect(wrapper.find('.p-autocomplete.p-component').exists()).toBe(true);
        expect(wrapper.find('.p-autocomplete-input').exists()).toBe(true);
    });

    it('search complete', async () => {
        const event = { target: { value: 'b' } };

        wrapper.vm.onInput(event);
        await wrapper.vm.$nextTick();

        wrapper.vm.search(event, event.target.value, 'input');
        await wrapper.vm.$nextTick();

        await wrapper.setProps({
            suggestions: [{ name: 'Bahrain', code: 'BH' }]
        });

        expect(wrapper.find('.p-autocomplete-list').exists()).toBe(true);
        expect(wrapper.findAll('.p-autocomplete-option').length).toBe(1);
    });

    it('should show overlay and empty-message if there are no suggestions', async () => {
        const event = { target: { value: 'b' } };

        wrapper.vm.search(event, event.target.value, 'input');
        await wrapper.vm.$nextTick();

        await wrapper.setProps({
            suggestions: []
        });

        expect(wrapper.find('.p-autocomplete-list').exists()).toBe(true);
        expect(wrapper.findAll('.p-autocomplete-option').length).toBe(0);
        expect(wrapper.find('.p-autocomplete-empty-message').exists()).toBe(true);
    });

    describe('forceSelection', () => {
        let onError;

        beforeEach(async () => {
            onError = vi.fn();
            wrapper.vm.$.appContext.config.errorHandler = onError;

            await wrapper.setProps({ forceSelection: true, optionLabel: 'name' });
        });

        it.each([1, 0])('selects a suggestion with numeric label %s', async (label) => {
            const option = { name: label };

            await wrapper.setProps({ suggestions: [option] });
            await wrapper.get('input').setValue(String(label));

            expect(onError).not.toHaveBeenCalled();
            expect(wrapper.emitted('update:modelValue').slice(-1)[0]).toEqual([option]);
            expect(wrapper.emitted('option-select').slice(-1)[0][0].value).toEqual(option);
            expect(wrapper.get('input').element.value).toBe(String(label));
        });

        it.each([1, 0])('clears a selected suggestion with numeric label %s', async (label) => {
            const option = { name: label };

            await wrapper.setProps({ modelValue: option, suggestions: [option] });
            expect(wrapper.get('input').element.value).toBe(String(label));

            await wrapper.get('input').setValue('');

            expect(onError).not.toHaveBeenCalled();
            expect(wrapper.emitted('update:modelValue').slice(-1)[0]).toEqual([null]);
            expect(wrapper.get('input').element.value).toBe('');
        });

        it.each([
            ['Bahrain', 'bAhRaIn', undefined],
            ['I', 'ı', 'tr']
        ])('preserves case-insensitive matching for %s', async (label, value, searchLocale) => {
            const option = { name: label };

            await wrapper.setProps({ suggestions: [option], searchLocale });
            await wrapper.get('input').setValue(value);

            expect(onError).not.toHaveBeenCalled();
            expect(wrapper.emitted('update:modelValue').slice(-1)[0]).toEqual([option]);
        });

        it.each([
            [1, '2'],
            [null, 'null'],
            [undefined, 'undefined']
        ])('rejects unmatched input for label %s', async (label, value) => {
            await wrapper.setProps({ suggestions: [{ name: label }] });
            await wrapper.get('input').setValue(value);

            expect(onError).not.toHaveBeenCalled();
            expect(wrapper.emitted('update:modelValue').slice(-1)[0]).toEqual([null]);
            expect(wrapper.emitted('option-select')).toBeUndefined();
            expect(wrapper.get('input').element.value).toBe('');
        });
    });

    it('dropdown', () => {
        it('should have correct custom icon', async () => {
            wrapper.setProps({
                dropdown: true,
                dropdownIcon: 'pi pi-discord'
            });

            await nextTick();

            const token = wrapper.find('.p-button').find('span');

            expect(token.classes()).toContain('pi-discord');
        });
    });

    it('multiple', () => {
        it('should have correct custom icon', async () => {
            wrapper.setProps({
                multiple: true,
                removeTokenIcon: 'pi pi-discord',
                modelValue: ['foo', 'bar']
            });

            await nextTick();

            wrapper.findAll('.p-autocomplete-token-icon').forEach((tokenIcon) => {
                expect(tokenIcon.classes()).toContain('pi-discord');
            });
        });
    });
});
