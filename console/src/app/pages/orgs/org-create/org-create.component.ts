import { animate, style, transition, trigger } from '@angular/animations';
import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreateOrgRequest, CreateUserRequest, Gender, OrgSetUpResponse } from 'src/app/proto/generated/admin_pb';
import { PasswordComplexityPolicy } from 'src/app/proto/generated/management_pb';
import { AdminService } from 'src/app/services/admin.service';
import { OrgService } from 'src/app/services/org.service';
import { ToastService } from 'src/app/services/toast.service';

function passwordConfirmValidator(c: AbstractControl): any {
    if (!c.parent || !c) {
        return;
    }
    const pwd = c.parent.get('password');
    const cpwd = c.parent.get('confirmPassword');

    if (!pwd || !cpwd) {
        return;
    }
    if (pwd.value !== cpwd.value) {
        return { invalid: true };
    }
}

@Component({
    selector: 'app-org-create',
    templateUrl: './org-create.component.html',
    styleUrls: ['./org-create.component.scss'],
    animations: [
        trigger('openClose', [
            transition(':enter', [
                style({ height: '0', opacity: 0 }),
                animate('150ms ease-in-out', style({ height: '*', opacity: 1 })),
            ]),
            transition(':leave', [
                animate('150ms ease-in-out', style({ height: '0', opacity: 0 })),
            ]),
        ]),
    ],
})
export class OrgCreateComponent {
    public orgForm!: FormGroup;
    public userForm!: FormGroup;

    public genders: Gender[] = [Gender.GENDER_FEMALE, Gender.GENDER_MALE, Gender.GENDER_UNSPECIFIED];
    public languages: string[] = ['de', 'en'];

    public policy!: PasswordComplexityPolicy.AsObject;

    constructor(
        private router: Router,
        private toast: ToastService,
        private adminService: AdminService,
        private _location: Location,
        private fb: FormBuilder,
        private orgService: OrgService,
    ) {
        const validators: Validators[] = [Validators.required];

        this.orgForm = this.fb.group({
            name: ['', [Validators.required]],
            domain: ['', [Validators.required]],
        });
        this.orgService.GetPasswordComplexityPolicy().then(data => {
            this.policy = data.toObject();
            if (this.policy.minLength) {
                validators.push(Validators.minLength(this.policy.minLength));
            }
            if (this.policy.hasLowercase) {
                validators.push(Validators.pattern(/[a-z]/g));
            }
            if (this.policy.hasUppercase) {
                validators.push(Validators.pattern(/[A-Z]/g));
            }
            if (this.policy.hasNumber) {
                validators.push(Validators.pattern(/[0-9]/g));
            }
            if (this.policy.hasSymbol) {
                validators.push(Validators.pattern(/[^a-z0-9]/gi));
            }

            this.userForm = this.fb.group({
                userName: ['', [Validators.required]],
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],
                email: ['', [Validators.required]],
                gender: [''],
                nickName: [''],
                preferredLanguage: [''],
                password: ['', validators],
                confirmPassword: ['', [...validators, passwordConfirmValidator]],
            });
        }).catch(error => {
            console.log('no password complexity policy defined!');
            console.error(error);
            this.userForm = this.fb.group({
                userName: ['', [Validators.required]],
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],
                email: ['', [Validators.required]],
                gender: [''],
                nickName: [''],
                preferredLanguage: [''],
                password: ['', validators],
                confirmPassword: ['', [...validators, passwordConfirmValidator]],
            });
        });
    }

    public createSteps: number = 2;
    public currentCreateStep: number = 1;

    public finish(): void {
        const createOrgRequest: CreateOrgRequest = new CreateOrgRequest();
        createOrgRequest.setName(this.name?.value);
        createOrgRequest.setDomain(this.domain?.value);

        const registerUserRequest: CreateUserRequest = new CreateUserRequest();
        registerUserRequest.setUserName(this.userName?.value);
        registerUserRequest.setEmail(this.email?.value);
        registerUserRequest.setFirstName(this.firstName?.value);
        registerUserRequest.setLastName(this.lastName?.value);
        registerUserRequest.setNickName(this.nickName?.value);
        registerUserRequest.setGender(this.gender?.value);
        registerUserRequest.setPassword(this.password?.value);
        registerUserRequest.setPreferredLanguage(this.preferredLanguage?.value);

        this.adminService
            .SetUpOrg(createOrgRequest, registerUserRequest)
            .then((data: OrgSetUpResponse) => {
                this.router.navigate(['orgs', data.toObject().org?.id]);
            })
            .catch(data => {
                this.toast.showError(data.message);
            });
    }

    public next(): void {
        this.currentCreateStep++;
    }

    public previous(): void {
        this.currentCreateStep--;
    }

    public get name(): AbstractControl | null {
        return this.orgForm.get('name');
    }

    public get domain(): AbstractControl | null {
        return this.orgForm.get('domain');
    }

    public get userName(): AbstractControl | null {
      return this.userForm.get('userName');
    }

    public get firstName(): AbstractControl | null {
        return this.userForm.get('firstName');
    }

    public get lastName(): AbstractControl | null {
        return this.userForm.get('lastName');
    }

    public get email(): AbstractControl | null {
        return this.userForm.get('email');
    }

    public get nickName(): AbstractControl | null {
        return this.userForm.get('nickName');
    }

    public get preferredLanguage(): AbstractControl | null {
        return this.userForm.get('preferredLanguage');
    }

    public get gender(): AbstractControl | null {
        return this.userForm.get('gender');
    }

    public get password(): AbstractControl | null {
        return this.userForm.get('password');
    }

    public get confirmPassword(): AbstractControl | null {
        return this.userForm.get('confirmPassword');
    }

    public close(): void {
        this._location.back();
    }
}
