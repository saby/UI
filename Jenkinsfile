@Library('pipeline') _

def version = '20.2100'

node ('controls') {
    checkout_pipeline("20.2100/pea/fix_build_only_fail")
    run_branch = load '/home/sbis/jenkins_pipeline/platforma/branch/run_branch'
    run_branch.execute('ui', version)
}